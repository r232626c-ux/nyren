const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const { getOrCreateUserByExternalId } = require('../utils/userUuidHelper');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/plain', 'text/html'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and HTML files are allowed.'));
    }
  },
});

/**
 * POST /api/upload
 * Upload a document (PDF or text file)
 */
router.post('/', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.user?.uuid || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: `User_${userId}`,
      email: `user_${userId}@mobile.app`,
    });

    let textContent = '';

    if (req.file.mimetype === 'application/pdf') {
      try {
        const data = await pdfParse(req.file.buffer);
        textContent = data.text;
      } catch (pdfError) {
        console.error('[Upload] PDF parsing error:', pdfError);
        return res.status(400).json({ error: 'Failed to parse PDF file' });
      }
    } else {
      textContent = req.file.buffer.toString('utf-8');
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'Document is empty or unreadable' });
    }

    // Create document record
    const doc = await Document.create({
      userId: user.id, // Use integer id
      name: req.file.originalname,
      content: textContent,
      mimeType: req.file.mimetype,
    });

    console.log(`[Upload] Document uploaded: ${doc.id} (${req.file.originalname}) for user ${user.uuid}`);

    res.json({
      status: 'success',
      message: 'Document uploaded successfully',
      documentId: doc.id,
      documentName: doc.name,
      contentLength: textContent.length,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/upload/documents/:userId
 * Get all documents for a user
 */
router.get('/documents/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.uuid || req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: `User_${userId}`,
      email: `user_${userId}@mobile.app`,
    });

    const documents = await Document.findAll({
      where: { userId: user.id }, // Use integer id
      attributes: ['id', 'name', 'createdAt', 'mimeType'],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      status: 'success',
      documents,
    });
  } catch (error) {
    console.error('[Upload] Error fetching documents:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
    });
  }
});

/**
 * DELETE /api/upload/:documentId
 * Delete a document
 */
router.delete('/:documentId', optionalAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.uuid || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: `User_${userId}`,
      email: `user_${userId}@mobile.app`,
    });
    const doc = await Document.findOne({
      where: { id: documentId, userId: user.id }, // Use integer id
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await doc.destroy();

    res.json({
      status: 'success',
      message: 'Document deleted',
    });
  } catch (error) {
    console.error('[Upload] Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
    });
  }
});

module.exports = router;
