/**
 * Science Feed routes — a Twitter-style feed for researchers to post
 * updates, paper abstracts, figures/photos, and science memes.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { FeedPost, FeedLike, FeedComment, User } = require('../models');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'feed');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
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
      return cb(new Error('Unsupported file type — images, videos, or PDFs only'));
    }
    cb(null, true);
  },
});

const POST_TYPES = new Set(['post', 'abstract', 'meme', 'image']);

/**
 * POST /api/feed/upload
 * Upload an image/figure/meme/PDF to attach to a post.
 */
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });

    res.status(201).json({
      success: true,
      data: {
        attachmentUrl: `/uploads/feed/${req.file.filename}`,
        attachmentName: req.file.originalname,
        attachmentType: req.file.mimetype,
      },
    });
  });
});

/**
 * GET /api/feed/posts
 * Public feed, newest first. When authenticated, includes `likedByMe`.
 */
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, postType } = req.query;

    const where = {};
    if (postType && POST_TYPES.has(postType)) where.postType = postType;

    const { rows: posts, count: total } = await FeedPost.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });

    const postIds = posts.map((p) => p.id);
    let likeCounts = {};
    let commentCounts = {};
    let likedPostIds = new Set();

    if (postIds.length > 0) {
      const { sequelize } = require('../config/db');
      const { Op } = require('sequelize');

      const [likeRows] = await sequelize.query(
        `SELECT "postId", COUNT(*)::int AS count FROM feed_likes WHERE "postId" IN (:postIds) GROUP BY "postId"`,
        { replacements: { postIds } }
      );
      likeCounts = Object.fromEntries(likeRows.map((r) => [r.postId, r.count]));

      const [commentRows] = await sequelize.query(
        `SELECT "postId", COUNT(*)::int AS count FROM feed_comments WHERE "postId" IN (:postIds) GROUP BY "postId"`,
        { replacements: { postIds } }
      );
      commentCounts = Object.fromEntries(commentRows.map((r) => [r.postId, r.count]));

      if (req.user) {
        const myLikes = await FeedLike.findAll({
          where: { postId: { [Op.in]: postIds }, userId: req.user.uuid },
          attributes: ['postId'],
        });
        likedPostIds = new Set(myLikes.map((l) => l.postId));
      }
    }

    const data = posts.map((p) => ({
      ...p.toJSON(),
      likeCount: likeCounts[p.id] || 0,
      commentCount: commentCounts[p.id] || 0,
      likedByMe: likedPostIds.has(p.id),
      isMine: req.user ? p.userId === req.user.uuid : false,
    }));

    res.json({ success: true, data, pagination: { total, limit: parseInt(limit, 10) || 20, offset: parseInt(offset, 10) || 0 } });
  } catch (error) {
    console.error('[Feed] Posts fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/feed/posts
 */
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { content, postType, attachmentUrl, attachmentName, attachmentType } = req.body;

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedContent && !attachmentUrl) {
      return res.status(400).json({ success: false, error: 'Post content or attachment is required' });
    }
    if (trimmedContent.length > 5000) {
      return res.status(400).json({ success: false, error: 'Post is too long (max 5000 characters)' });
    }

    const type = POST_TYPES.has(postType) ? postType : 'post';
    const user = await User.findOne({ where: { uuid: req.user.uuid } });

    const post = await FeedPost.create({
      userId: req.user.uuid,
      userName: user?.name || 'Researcher',
      content: trimmedContent || null,
      postType: type,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    });

    res.status(201).json({
      success: true,
      data: { ...post.toJSON(), likeCount: 0, commentCount: 0, likedByMe: false, isMine: true },
    });
  } catch (error) {
    console.error('[Feed] Post create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/feed/posts/:id
 */
router.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await FeedPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (post.userId !== req.user.uuid) {
      return res.status(403).json({ success: false, error: 'You can only delete your own posts' });
    }

    await post.destroy();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error('[Feed] Post delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/feed/posts/:id/like
 * Toggles a like for the current user.
 */
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await FeedPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const existing = await FeedLike.findOne({ where: { postId: post.id, userId: req.user.uuid } });

    let liked;
    if (existing) {
      await existing.destroy();
      liked = false;
    } else {
      await FeedLike.create({ postId: post.id, userId: req.user.uuid });
      liked = true;
    }

    const likeCount = await FeedLike.count({ where: { postId: post.id } });

    res.json({ success: true, data: { liked, likeCount } });
  } catch (error) {
    console.error('[Feed] Like toggle error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/feed/posts/:id/comments
 */
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await FeedComment.findAll({
      where: { postId: req.params.id },
      order: [['createdAt', 'ASC']],
      limit: 200,
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('[Feed] Comments fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/feed/posts/:id/comments
 */
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) return res.status(400).json({ success: false, error: 'Comment content is required' });
    if (trimmed.length > 1000) return res.status(400).json({ success: false, error: 'Comment is too long (max 1000 characters)' });

    const post = await FeedPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const user = await User.findOne({ where: { uuid: req.user.uuid } });

    const comment = await FeedComment.create({
      postId: post.id,
      userId: req.user.uuid,
      userName: user?.name || 'Researcher',
      content: trimmed,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('[Feed] Comment create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
