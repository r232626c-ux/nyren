const express = require('express');
const multer = require('multer');
const { Dataset } = require('../models');
const { detectDatasetFileType, isAllowedDatasetFile } = require('../utils/datasetFileUtils');
const { getSafeUserUuid } = require('../utils/userUuidHelper');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const { validateFileUpload, validateDatasetContent } = require('../middleware/validation');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (isAllowedDatasetFile(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported dataset formats are CSV, TSV, TXT, XLSX, XLS, VCF, and FASTQ.'));
    }
  },
});

router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), validateFileUpload, validateDatasetContent, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No dataset file provided.' });
    }

    const { name, type, metadata } = req.body;
    const userUuid = await getSafeUserUuid(req.user?.uuid ?? req.user?.id);

    if (!userUuid) {
      return res.status(403).json({ error: 'Authentication required to upload datasets.' });
    }

    // Use validated file content
    const parsedRows = req.validatedFile.rows;
    const headers = Array.isArray(req.validatedFile.headers) ? req.validatedFile.headers : [];

    const dataset = await Dataset.create({
      userId: userUuid,
      name: name || req.file.originalname,
      type: type || 'gene_expression',
      metadata: metadata ? JSON.parse(metadata) : {},
      raw_payload: {
        fileType: req.validatedFile.fileType,
        fileName: req.file.originalname,
        headers,
        rows: parsedRows,
        validation: {
          lineCount: req.validatedFile.lineCount,
          columnCount: req.validatedFile.columnCount,
          uploadedBy: userUuid,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    return res.json({
      status: 'success',
      message: 'Dataset uploaded successfully.',
      datasetId: dataset.id,
      datasetName: dataset.name,
      rowCount: parsedRows.length,
      headers: parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [],
      raw_payload: dataset.raw_payload,
    });
  } catch (error) {
    console.error('[Dataset Upload] Error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Dataset upload failed.',
    });
  }
});

module.exports = router;
