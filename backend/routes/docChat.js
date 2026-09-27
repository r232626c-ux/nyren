const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { askDocument, summarizeDocument } = require('../services/docService');
const { findUserByIdentifier } = require('../utils/userUuidHelper');
const { optionalAuth } = require('../middleware/auth');

/**
 * POST /api/doc-chat
 * Ask a question about a document
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { documentId, question: bodyQuestion, message, userId: requestUserId, language, max_tokens } = req.body;
    const question = bodyQuestion || message;
    const userId = req.user?.uuid || requestUserId;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await findUserByIdentifier(userId);
    if (!user) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Verify document exists and belongs to user
    const doc = await Document.findOne({
      where: { id: documentId, userId: user.id }, // Use integer id
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Get answer from the document
    const result = await askDocument(doc.content, question, { language, max_tokens });

    console.log(`[DocChat] Answered question for document ${documentId} (user ${user.uuid})`);

    res.json({
      status: 'success',
      mode: 'doc',
      documentId,
      documentName: doc.name,
      question,
      answer: result.answer,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('[DocChat] Error:', error);
    res.status(500).json({
      error: 'Document chat failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/doc-chat/summarize
 * Get a summary of a document
 */
router.post('/summarize', optionalAuth, async (req, res) => {
  try {
    const { documentId, userId: requestUserId } = req.body;
    const userId = req.user?.uuid || requestUserId;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await findUserByIdentifier(userId);
    if (!user) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    const doc = await Document.findOne({
      where: { id: documentId, userId: user.id }, // Use integer id
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    const result = await summarizeDocument(doc.content, doc.name);

    console.log(`[DocChat] Summarized document ${documentId} (user ${user.uuid})`);

    res.json({
      status: 'success',
      mode: 'doc',
      documentId,
      documentName: doc.name,
      summary: result.summary,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('[DocChat] Error summarizing:', error);
    res.status(500).json({
      error: 'Summarization failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/doc-chat/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    service: 'doc-chat',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
