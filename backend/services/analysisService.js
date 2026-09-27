const { sequelize, Sequelize } = require('../config/db');
const { Op } = Sequelize;
const {
  Dataset,
  AnalysisJob,
  AnalysisResult,
  BiomarkerResult,
  AIInterpretation,
} = require('../models');
const { addTask } = require('../queue/taskQueue');
const { executePipeline } = require('./pythonPipelineService');

const MAX_RETRIES = 3;

async function createAnalysisJob(userId, datasetPayload, taskType, params = {}, idempotencyKey = null) {
  if (idempotencyKey) {
    const existingJob = await AnalysisJob.findOne({
      where: {
        userId: userId || null,
        idempotencyKey,
        status: {
          [Op.notIn]: ['failed'],
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingJob) {
      console.log(`[ANALYSIS] Duplicate analysis request detected for idempotency key: ${idempotencyKey}`);
      return existingJob;
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const dataset = await Dataset.create(
      {
        userId: userId || null,
        name: datasetPayload.name || datasetPayload.type || 'expression_dataset',
        type: datasetPayload.type || 'gene_expression',
        metadata: datasetPayload.metadata || {},
        raw_payload: datasetPayload,
      },
      { transaction }
    );

    const job = await AnalysisJob.create(
      {
        userId: userId || null,
        datasetId: dataset.id,
        taskType,
        status: 'pending',
        attempt: 0,
        retryCount: 0,
        params,
        idempotencyKey: idempotencyKey || null,
      },
      { transaction }
    );

    await transaction.commit();

    await addTask('run-analysis', { jobId: job.id }, {
      jobId: `analysis-${idempotencyKey || job.id}`,
      attempts: MAX_RETRIES,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 50,
      removeOnFail: 20,
    });

    return job;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchJobStatus(jobId) {
  const job = await AnalysisJob.findByPk(jobId);
  if (!job) {
    return null;
  }
  return {
    id: job.id,
    status: job.status,
    taskType: job.taskType,
    attempt: job.attempt,
    retryCount: job.retryCount,
    errorMessage: job.errorMessage,
    updatedAt: job.updatedAt,
    createdAt: job.createdAt,
  };
}

async function fetchJobResult(jobId) {
  const job = await AnalysisJob.findByPk(jobId);
  if (!job) {
    return null;
  }
  const result = await AnalysisResult.findOne({ where: { jobId } });
  const biomarkers = await BiomarkerResult.findAll({ where: { jobId }, order: [['score', 'DESC']] });
  const interpretation = await AIInterpretation.findOne({ where: { jobId } });

  return {
    job: {
      id: job.id,
      status: job.status,
      taskType: job.taskType,
      attempt: job.attempt,
      retryCount: job.retryCount,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
    result: result ? result.summary : null,
    metrics: result ? result.metrics : null,
    biomarkers: biomarkers.map((entry) => ({
      gene: entry.gene,
      score: entry.score,
      logFoldChange: entry.logFoldChange,
      pValue: entry.pValue,
      consistency: entry.consistency,
      details: entry.details,
    })),
    interpretation: interpretation ? {
      model: interpretation.model,
      confidence: interpretation.confidence,
      interpretation: interpretation.interpretation,
      rawResponse: interpretation.raw_response,
    } : null,
  };
}

async function processAnalysisJob(jobData, attemptsMade = 0) {
  const jobId = jobData.jobId;
  const job = await AnalysisJob.findByPk(jobId);
  if (!job) {
    throw new Error(`Analysis job not found: ${jobId}`);
  }

  job.status = 'running';
  job.attempt = attemptsMade + 1;
  job.retryCount = attemptsMade;
  job.startedAt = new Date();
  await job.save();

  const dataset = await Dataset.findByPk(job.datasetId);
  if (!dataset) {
    job.status = 'failed';
    job.errorMessage = 'Associated dataset is missing.';
    job.completedAt = new Date();
    await job.save();
    throw new Error(job.errorMessage);
  }

  const payload = {
    job_id: job.id,
    dataset: dataset.raw_payload,
    task_type: job.taskType,
    params: job.params || {},
    max_retries: MAX_RETRIES,
    backoff_seconds: 10,
  };

  const pipelineResponse = await executePipeline(payload);
  const status = pipelineResponse.status;

  if (status !== 'success') {
    job.status = 'failed';
    job.errorMessage = pipelineResponse.error || 'Pipeline failed without a detailed error message.';
    job.completedAt = new Date();
    await job.save();
    throw new Error(job.errorMessage);
  }

  const transaction = await sequelize.transaction();
  try {
    await AnalysisResult.create(
      {
        jobId: job.id,
        summary: pipelineResponse.result,
        metrics: {
          taskType: job.taskType,
          createdAt: new Date().toISOString(),
        },
      },
      { transaction }
    );

    if (pipelineResponse.result?.biomarker_rankings) {
      const biomarkers = pipelineResponse.result.biomarker_rankings.map((entry) => ({
        jobId: job.id,
        gene: entry.gene,
        score: entry.score,
        logFoldChange: entry.log_fold_change,
        pValue: entry.p_value,
        consistency: entry.consistency,
        details: entry.details,
      }));
      await BiomarkerResult.bulkCreate(biomarkers, { transaction });
    }

    if (pipelineResponse.interpretation) {
      await AIInterpretation.create(
        {
          jobId: job.id,
          model: pipelineResponse.interpretation.model || 'openai',
          interpretation: pipelineResponse.interpretation,
          raw_response: pipelineResponse.interpretation.raw_response || null,
          confidence: pipelineResponse.interpretation.confidence || null,
        },
        { transaction }
      );
    }

    job.status = 'completed';
    job.errorMessage = null;
    job.completedAt = new Date();
    await job.save({ transaction });
    await transaction.commit();

    return pipelineResponse;
  } catch (err) {
    await transaction.rollback();
    job.status = 'failed';
    job.errorMessage = err.message;
    job.completedAt = new Date();
    await job.save();
    throw err;
  }
}

module.exports = {
  createAnalysisJob,
  fetchJobStatus,
  fetchJobResult,
  processAnalysisJob,
};
