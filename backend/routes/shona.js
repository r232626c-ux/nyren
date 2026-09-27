/**
 * Shona Learning API Routes
 * Handles vocabulary, lessons, progress, and grammar feedback
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const shonaGrammarParser = require('../services/shonaGrammarParser');
const ShonaVocabulary = require('../models/ShonaVocabulary');
const ShonaLesson = require('../models/ShonaLesson');
const ShonaUserProgress = require('../models/ShonaUserProgress');

// ==================== VOCABULARY ROUTES ====================

/**
 * GET /api/shona/vocabulary
 * Get vocabulary words by category and difficulty
 */
router.get('/vocabulary', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, limit = 20, offset = 0 } = req.query;

    const where = { isActive: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const words = await ShonaVocabulary.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: words.rows,
      pagination: {
        total: words.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('[Shona] Vocabulary fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/shona/vocabulary/:id
 * Get specific vocabulary word details
 */
router.get('/vocabulary/:id', authenticateToken, async (req, res) => {
  try {
    const word = await ShonaVocabulary.findByPk(req.params.id);

    if (!word) {
      return res.status(404).json({ success: false, error: 'Word not found' });
    }

    res.json({ success: true, data: word });
  } catch (error) {
    console.error('[Shona] Vocabulary detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/shona/vocabulary
 * Add new vocabulary (admin only)
 */
router.post('/vocabulary', authenticateToken, async (req, res) => {
  try {
    const { english, shona, pronunciation, category, difficulty, nounClass, exampleSentence } = req.body;

    // Validation
    if (!english || !shona || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: english, shona, category',
      });
    }

    const word = await ShonaVocabulary.create({
      english,
      shona,
      pronunciation,
      category,
      difficulty: difficulty || 'beginner',
      nounClass,
      exampleSentence,
      isActive: true,
    });

    res.status(201).json({ success: true, data: word });
  } catch (error) {
    console.error('[Shona] Vocabulary create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== LESSONS ROUTES ====================

/**
 * GET /api/shona/lessons
 * Get all lessons by level
 */
router.get('/lessons', authenticateToken, async (req, res) => {
  try {
    const { level, limit = 10, offset = 0 } = req.query;

    const where = { isActive: true };
    if (level) where.level = level;

    const lessons = await ShonaLesson.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['orderIndex', 'ASC']],
    });

    res.json({
      success: true,
      data: lessons.rows,
      pagination: {
        total: lessons.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('[Shona] Lessons fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/shona/lessons/:id
 * Get specific lesson details
 */
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  try {
    const lesson = await ShonaLesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('[Shona] Lesson detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/shona/lessons
 * Create new lesson (admin)
 */
router.post('/lessons', authenticateToken, async (req, res) => {
  try {
    const { title, description, level, grammarFocus, vocabularyIds, content } = req.body;

    if (!title || !level) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, level',
      });
    }

    const lesson = await ShonaLesson.create({
      title,
      description,
      level,
      grammarFocus,
      vocabularyIds,
      content,
      isActive: true,
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error('[Shona] Lesson create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PROGRESS ROUTES ====================

/**
 * GET /api/shona/progress
 * Get user's learning progress
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const { lessonId, status } = req.query;
    const userId = req.user.uuid;

    const where = { userId };
    if (lessonId) where.lessonId = lessonId;
    if (status) where.status = status;

    const progress = await ShonaUserProgress.findAll({
      where,
      order: [['lastAccessedAt', 'DESC']],
    });

    // Calculate stats
    const stats = {
      totalLessons: progress.length,
      completed: progress.filter((p) => p.status === 'completed').length,
      mastered: progress.filter((p) => p.status === 'mastered').length,
      inProgress: progress.filter((p) => p.status === 'in_progress').length,
      totalXp: progress.reduce((sum, p) => sum + (p.xpEarned || 0), 0),
      totalTimeSeconds: progress.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0),
      currentStreak: Math.max(...progress.map((p) => p.streakCount || 0), 0),
    };

    res.json({ success: true, data: progress, stats });
  } catch (error) {
    console.error('[Shona] Progress fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/shona/progress
 * Update lesson progress
 */
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { lessonId, score, timeSpentSeconds, status } = req.body;
    const userId = req.user.uuid;

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Missing lessonId' });
    }

    // Find or create progress record
    let progress = await ShonaUserProgress.findOne({ where: { userId, lessonId } });

    if (progress) {
      // Update existing
      progress.attempts += 1;
      if (score !== undefined) {
        progress.score = score;
        progress.correctAnswers = Math.round((score / 100) * (progress.totalQuestions || 10));

        // Check for mastery
        if (score >= 80 && progress.status !== 'mastered') {
          progress.status = 'mastered';
          progress.masteredAt = new Date();
          progress.xpEarned = (progress.xpEarned || 0) + 50; // Bonus XP
        } else if (status) {
          progress.status = status;
        }
      }
      if (timeSpentSeconds !== undefined) {
        progress.timeSpentSeconds += timeSpentSeconds;
      }
      progress.lastAccessedAt = new Date();
      await progress.save();
    } else {
      // Create new
      progress = await ShonaUserProgress.create({
        userId,
        lessonId,
        status: status || 'in_progress',
        score: score || 0,
        attempts: 1,
        timeSpentSeconds: timeSpentSeconds || 0,
        xpEarned: score && score >= 80 ? 50 : 10,
        streakCount: 1,
      });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('[Shona] Progress update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GRAMMAR PARSER ROUTES ====================

/**
 * POST /api/shona/grammar/parse
 * Parse Shona word or sentence
 */
router.post('/grammar/parse', authenticateToken, async (req, res) => {
  try {
    const { text, type = 'word' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Missing text to parse' });
    }

    let analysis;
    if (type === 'sentence') {
      analysis = shonaGrammarParser.analyzeSentence(text);
    } else {
      analysis = shonaGrammarParser.parseWord(text);
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('[Shona] Grammar parse error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/shona/grammar/feedback
 * Get grammar feedback on user input
 */
router.post('/grammar/feedback', authenticateToken, async (req, res) => {
  try {
    const { userInput, expectedOutput } = req.body;

    if (!userInput) {
      return res.status(400).json({ success: false, error: 'Missing userInput' });
    }

    const feedback = shonaGrammarParser.provideFeedback(userInput, expectedOutput);

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('[Shona] Grammar feedback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/shona/grammar/suggestions
 * Get correction suggestions
 */
router.post('/grammar/suggestions', authenticateToken, async (req, res) => {
  try {
    const { incorrectWord, context } = req.body;

    if (!incorrectWord) {
      return res.status(400).json({ success: false, error: 'Missing incorrectWord' });
    }

    const suggestions = shonaGrammarParser.suggestCorrections(incorrectWord, context || {});

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('[Shona] Grammar suggestions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
