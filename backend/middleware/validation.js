const validator = require('validator');
const { AnalysisJob } = require('../models');
const {
  detectDatasetFileType,
  isAllowedDatasetFile,
  parseDatasetFile,
} = require('../utils/datasetFileUtils');

// Input validation middleware
const validateAnalysisRequest = (req, res, next) => {
  const { dataset, taskType, params } = req.body;

  // Validate dataset
  if (!dataset || typeof dataset !== 'object') {
    return res.status(400).json({
      error: 'Invalid dataset',
      message: 'Dataset must be a valid object containing gene expression data'
    });
  }

  const hasRawPayload = dataset.raw_payload && typeof dataset.raw_payload === 'object';
  if (!hasRawPayload) {
    if (!dataset.genes || !Array.isArray(dataset.genes) || dataset.genes.length === 0) {
      return res.status(400).json({
        error: 'Invalid dataset',
        message: 'Dataset must contain a non-empty genes array'
      });
    }

    if (!dataset.samples || !Array.isArray(dataset.samples) || dataset.samples.length === 0) {
      return res.status(400).json({
        error: 'Invalid dataset',
        message: 'Dataset must contain a non-empty samples array'
      });
    }

    if (!dataset.values || !Array.isArray(dataset.values) || dataset.values.length === 0) {
      return res.status(400).json({
        error: 'Invalid dataset',
        message: 'Dataset must contain a non-empty values array'
      });
    }
  } else if (!Array.isArray(dataset.raw_payload.rows) || dataset.raw_payload.rows.length === 0) {
    return res.status(400).json({
      error: 'Invalid dataset',
      message: 'Dataset raw_payload must contain a non-empty rows array'
    });
  }

  // Validate task type
  const validTaskTypes = [
    'qc_pipeline',
    'differential_expression_pipeline',
    'biomarker_pipeline',
    'descriptive_stats_pipeline',
    'correlation_pipeline',
  ];
  if (!taskType || !validTaskTypes.includes(taskType)) {
    return res.status(400).json({
      error: 'Invalid task type',
      message: `Task type must be one of: ${validTaskTypes.join(', ')}`
    });
  }

  // Validate params if provided
  if (params && typeof params !== 'object') {
    return res.status(400).json({
      error: 'Invalid parameters',
      message: 'Parameters must be a valid object'
    });
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
  if (idempotencyKey && typeof idempotencyKey !== 'string') {
    return res.status(400).json({
      error: 'Invalid idempotency key',
      message: 'Idempotency key must be a string'
    });
  }

  // Sanitize metadata
  if (dataset.metadata) {
    for (const [key, value] of Object.entries(dataset.metadata)) {
      if (typeof value === 'string') {
        dataset.metadata[key] = validator.escape(value);
      }
    }
  }

  next();
};

const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please upload a dataset file'
    });
  }

  const fileType = detectDatasetFileType(req.file.originalname, req.body?.file_type);
  if (!fileType || !isAllowedDatasetFile(req.file.mimetype, req.file.originalname)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Supported dataset file types: CSV, TSV, TXT, XLSX, XLS, VCF, FASTQ'
    });
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 50MB'
    });
  }

  req.fileType = fileType;
  next();
};

const validateDatasetContent = (req, res, next) => {
  try {
    const fileType = req.fileType || detectDatasetFileType(req.file.originalname, req.body?.file_type);
    if (!fileType) {
      return res.status(400).json({
        error: 'Unsupported dataset type',
        message: 'Unable to detect dataset file type from file name or form metadata'
      });
    }

    const buffer = req.file.buffer;
    const content = buffer.toString('utf-8');
    const parsed = parseDatasetFile(fileType, buffer, content);

    if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid dataset file',
        message: 'Dataset file must contain valid rows'
      });
    }

    if (['csv', 'tsv', 'txt'].includes(fileType) && parsed.headers.length < 3) {
      return res.status(400).json({
        error: 'Invalid dataset structure',
        message: 'Dataset must contain at least 3 columns for gene expression support'
      });
    }

    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
    ];

    const linesToCheck = ['csv', 'tsv', 'txt', 'vcf'].includes(fileType)
      ? String(content).split(/\r?\n/).slice(0, 10)
      : [];

    for (const line of linesToCheck) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(line)) {
          return res.status(400).json({
            error: 'Potentially malicious content detected',
            message: 'File contains suspicious content that may be harmful'
          });
        }
      }
    }

    req.validatedFile = {
      ...parsed,
      fileType,
      content,
      originalName: req.file.originalname,
    };

    next();
  } catch (error) {
    console.error('[VALIDATION] File content validation failed:', error);
    return res.status(400).json({
      error: 'File validation failed',
      message: error.message || 'Unable to process the uploaded file'
    });
  }
};

const validateJobId = async (req, res, next) => {
  const { jobId } = req.params;

  if (!jobId || !validator.isUUID(jobId)) {
    return res.status(400).json({
      error: 'Invalid job ID',
      message: 'Job ID must be a valid UUID'
    });
  }

  // Check if job exists and belongs to user (if authenticated)
  try {
    const job = await AnalysisJob.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The specified analysis job does not exist'
      });
    }

    // If user is authenticated, check ownership
    if (req.user && job.userId && job.userId !== req.user.uuid) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this job'
      });
    }

    req.job = job;
    next();
  } catch (error) {
    console.error('[VALIDATION] Job validation failed:', error);
    return res.status(500).json({
      error: 'Validation failed',
      message: 'Unable to validate job access'
    });
  }
};

module.exports = {
  validateAnalysisRequest,
  validateFileUpload,
  validateDatasetContent,
  validateJobId,
};