const {
  createAnalysisJob,
  fetchJobStatus,
  fetchJobResult,
} = require('../services/analysisService');
const { AnalysisJob, Dataset, User } = require('../models');
const validator = require('validator');
const {
  getOrCreateUserByExternalId,
} = require('../utils/userUuidHelper');

const extractRequestUserId = (req) => {
  return (
    req.query?.userId ||
    req.params?.userId ||
    req.body?.userId ||
    req.user?.uuid ||
    req.user?.id ||
    null
  );
};

const resolveUserFromIdentifier = async (identifier) => {
  if (!identifier) return null;

  let user = null;
  if (validator.isUUID(String(identifier))) {
    user = await User.findOne({ where: { uuid: identifier } });
  } else if (validator.isInt(String(identifier))) {
    user = await User.findByPk(Number(identifier));
  }

  if (!user) {
    user = await getOrCreateUserByExternalId(identifier, {
      name: `User_${identifier}`,
      email: `${identifier}@coli.local`,
    });
  }

  return user;
};

async function submitAnalysisJob(req, res) {
  try {
    const requestUserId = extractRequestUserId(req);
    if (!requestUserId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    const user = await resolveUserFromIdentifier(requestUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userUuid = user.uuid;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const { dataset, taskType, params } = req.body;

    if (!dataset || typeof dataset !== 'object') {
      return res.status(400).json({ error: 'dataset is required and must be an object.' });
    }

    if (!taskType) {
      return res.status(400).json({ error: 'taskType is required.' });
    }

    const job = await createAnalysisJob(userUuid, dataset, taskType, params || {}, idempotencyKey);

    return res.status(202).json({
      status: 'queued',
      jobId: job.id,
      taskType: job.taskType,
      datasetId: job.datasetId,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error('[Analysis] submitAnalysisJob failed:', error);
    return res.status(500).json({ error: 'Failed to queue analysis job.', message: error.message });
  }
}

async function getAnalysisJobStatus(req, res) {
  try {
    const job = req.job;
    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found.' });
    }

    const status = await fetchJobStatus(job.id);
    return res.json({ status: 'success', job: status });
  } catch (error) {
    console.error('[Analysis] getAnalysisJobStatus failed:', error);
    return res.status(500).json({ error: 'Failed to fetch job status.', message: error.message });
  }
}

async function getAnalysisJobResult(req, res) {
  try {
    const job = req.job;
    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found.' });
    }

    const result = await fetchJobResult(job.id);
    return res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[Analysis] getAnalysisJobResult failed:', error);
    return res.status(500).json({ error: 'Failed to fetch job result.', message: error.message });
  }
}

async function listAnalysisJobs(req, res) {
  try {
    const where = {};
    const requestUserId = extractRequestUserId(req);

    if (!requestUserId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }

    const user = await resolveUserFromIdentifier(requestUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userUuid = user.uuid;
    where.userId = userUuid;

    if (req.user && req.user.role === 'admin' && req.query.userId) {
      const adminUser = await resolveUserFromIdentifier(req.query.userId);
      if (adminUser) {
        where.userId = adminUser.uuid;
      }
    }

    if (!where.userId) {
      return res.json({ status: 'success', jobs: [] });
    }

    const jobs = await AnalysisJob.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: Dataset, attributes: ['id', 'name', 'type'] }],
    });

    return res.json({ status: 'success', jobs });
  } catch (error) {
    console.error('[Analysis] listAnalysisJobs failed:', error);
    return res.status(500).json({ error: 'Failed to fetch analysis jobs.', message: error.message });
  }
}

module.exports = {
  submitAnalysisJob,
  getAnalysisJobStatus,
  getAnalysisJobResult,
  listAnalysisJobs,
};
