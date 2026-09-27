/**
 * Research Community routes — Discord/Slack-style channels for researchers
 * to discuss bioscience, bioinformatics, biochemistry, physics, etc.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { ResearchChannel, ResearchMessage, User } = require('../models');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'community');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf', 'text/plain', 'text/csv',
  'application/json', 'application/zip',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname).slice(0, 10);
      cb(null, `${crypto.randomUUID()}${safeExt}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (videos are bigger than images)
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

const DEFAULT_CHANNELS = [
  { slug: 'general', name: 'General', description: 'Cross-discipline discussion and announcements', icon: '💬' },
  { slug: 'bioscience', name: 'Bioscience', description: 'Cell biology, genetics, molecular biology', icon: '🧬' },
  { slug: 'bioinformatics', name: 'Bioinformatics', description: 'Sequence analysis, pipelines, tools', icon: '🔬' },
  { slug: 'biochemistry', name: 'Biochemistry', description: 'Molecules, reactions, drug discovery', icon: '⚗️' },
  { slug: 'physics', name: 'Physics', description: 'Biophysics, modeling, instrumentation', icon: '📊' },
];

async function ensureDefaultChannels() {
  const count = await ResearchChannel.count();
  if (count > 0) return;

  await ResearchChannel.bulkCreate(DEFAULT_CHANNELS, { ignoreDuplicates: true });
}

/**
 * GET /api/community/channels
 */
router.get('/channels', async (req, res) => {
  try {
    await ensureDefaultChannels();

    const channels = await ResearchChannel.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('[Community] Channels fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/community/channels
 * Create a new topic channel.
 */
router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Missing channel name' });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) {
      return res.status(400).json({ success: false, error: 'Channel name must contain letters or numbers' });
    }

    const [channel, created] = await ResearchChannel.findOrCreate({
      where: { slug },
      defaults: { slug, name: name.trim(), description: description || null, icon: icon || '💬' },
    });

    res.status(created ? 201 : 200).json({ success: true, data: channel, created });
  } catch (error) {
    console.error('[Community] Channel create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/community/channels/:channelId/messages
 * Supports polling via `after` (ISO timestamp) to fetch only new messages.
 */
router.get('/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { after, limit = 50 } = req.query;

    const where = { channelId };
    if (after) {
      const { Op } = require('sequelize');
      where.createdAt = { [Op.gt]: new Date(after) };
    }

    const messages = await ResearchMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: Math.min(parseInt(limit, 10) || 50, 200),
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('[Community] Messages fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/community/upload
 * Upload a file/image to share in a message. Returns a relative URL to
 * pair with the follow-up POST message call.
 */
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    res.status(201).json({
      success: true,
      data: {
        attachmentUrl: `/uploads/community/${req.file.filename}`,
        attachmentName: req.file.originalname,
        attachmentType: req.file.mimetype,
      },
    });
  });
});

/**
 * POST /api/community/channels/:channelId/messages
 */
router.post('/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, attachmentUrl, attachmentName, attachmentType } = req.body;

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedContent && !attachmentUrl) {
      return res.status(400).json({ success: false, error: 'Message content or attachment is required' });
    }
    if (trimmedContent.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message is too long (max 2000 characters)' });
    }

    const channel = await ResearchChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    const user = await User.findOne({ where: { uuid: req.user.uuid } });

    const message = await ResearchMessage.create({
      channelId,
      userId: req.user.uuid,
      userName: user?.name || 'Researcher',
      content: trimmedContent || null,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[Community] Message create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/community/members
 * Directory of every Coli user, so researchers can see who else is on the
 * platform (not just people who've already posted). Public read, like
 * channels/messages — no email or other sensitive fields are exposed.
 */
router.get('/members', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { limit = 200, offset = 0 } = req.query;

    const members = await User.findAndCountAll({
      where: { email: { [Op.notLike]: '%@coli.local' } },
      attributes: ['uuid', 'name', 'createdAt'],
      order: [['createdAt', 'ASC']],
      limit: Math.min(parseInt(limit, 10) || 200, 500),
      offset: parseInt(offset, 10) || 0,
    });

    res.json({
      success: true,
      data: members.rows,
      pagination: { total: members.count, limit: parseInt(limit, 10) || 200, offset: parseInt(offset, 10) || 0 },
    });
  } catch (error) {
    console.error('[Community] Members fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
