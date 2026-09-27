/**
 * Learning Modules API Routes
 * Handles AI, Science, and Bioinformatics curriculum
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/db');
const LearningModule = require('../models/LearningModule');
const ModuleContent = require('../models/ModuleContent');
const UserModuleProgress = require('../models/UserModuleProgress');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const ScientificReference = require('../models/ScientificReference');
const LessonReference = require('../models/LessonReference');
const { verifyPubMedReference } = require('../services/pubmedReferenceService');
const { Op } = require('sequelize');
const { sanitizeLesson, gradeAssessment } = require('../services/learningAssessmentService');

async function attachScientificReferences(lessons) {
  const sanitized = lessons.map(sanitizeLesson);
  const lessonIds = sanitized.map((lesson) => lesson.id).filter(Boolean);
  if (!lessonIds.length) return sanitized;

  const links = await LessonReference.findAll({
    where: { lessonId: { [Op.in]: lessonIds } },
    include: [{ model: ScientificReference, as: 'Reference' }],
  });
  const byLesson = new Map();
  for (const link of links) {
    const row = link.toJSON();
    if (!row.Reference) continue;
    const list = byLesson.get(row.lessonId) || [];
    list.push({ ...row.Reference, relevance: row.relevance || row.Reference.relevance || null });
    byLesson.set(row.lessonId, list);
  }

  return sanitized.map((lesson) => ({
    ...lesson,
    scientificReferences: byLesson.get(lesson.id) || [],
  }));
}

async function sanitizeModule(module) {
  const data = module?.toJSON ? module.toJSON() : module;
  if (Array.isArray(data?.ModuleContents)) {
    data.ModuleContents = await attachScientificReferences(data.ModuleContents);
  }
  return data;
}

// ==================== MODULES ROUTES ====================

/**
 * GET /api/learn/modules
 * Get all learning modules by category
 */
router.get('/modules', async (req, res) => {
  try {
    const { category, difficulty, limit = 20, offset = 0 } = req.query;

    const where = {
      isActive: true,
      [Op.or]: [{ status: 'published' }, { status: null }],
    };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const modules = await LearningModule.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['orderIndex', 'ASC']],
    });

    res.json({
      success: true,
      data: modules.rows,
      pagination: {
        total: modules.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('[Learning] Modules fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/modules/:id
 * Get specific module details with all content
 */
router.get('/modules/:id', async (req, res) => {
  try {
    const module = await LearningModule.findOne({
      where: {
        id: req.params.id,
        isActive: true,
        [Op.or]: [{ status: 'published' }, { status: null }],
      },
      include: [{ model: ModuleContent, as: 'ModuleContents' }],
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    res.json({ success: true, data: await sanitizeModule(module) });
  } catch (error) {
    console.error('[Learning] Module detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/learn/modules
 * Create new learning module (admin)
 */
router.post('/modules', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      title, subtitle, description, category, subcategory, difficulty, content, prerequisites,
      learningObjectives, skills, masteryRequirements, finalProject, status, version,
      estimatedDurationMinutes, resources,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, category',
      });
    }

    const module = await LearningModule.create({
      title,
      subtitle: subtitle || null,
      description,
      category,
      subcategory,
      difficulty: difficulty || 'beginner',
      content,
      prerequisites,
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : null,
      skills: Array.isArray(skills) ? skills : null,
      masteryRequirements: masteryRequirements && typeof masteryRequirements === 'object' ? masteryRequirements : null,
      finalProject: finalProject && typeof finalProject === 'object' ? finalProject : null,
      status: ['draft', 'published', 'archived'].includes(status) ? status : 'published',
      version: typeof version === 'string' && version.trim() ? version.trim() : '1.0',
      publishedAt: status === 'published' || !status ? new Date() : null,
      estimatedDurationMinutes: Number.isInteger(Number(estimatedDurationMinutes)) ? Number(estimatedDurationMinutes) : undefined,
      resources: resources || undefined,
      isActive: true,
    });

    res.status(201).json({ success: true, data: module });
  } catch (error) {
    console.error('[Learning] Module create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MODULE CONTENT ROUTES ====================

/**
 * GET /api/learn/content/:moduleId
 * Get all content for a module
 */
router.get('/content/:moduleId', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const content = await ModuleContent.findAndCountAll({
      where: { moduleId: req.params.moduleId, isActive: true },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['orderIndex', 'ASC']],
    });

    res.json({
      success: true,
      data: await attachScientificReferences(content.rows),
      pagination: {
        total: content.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('[Learning] Content fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/content/item/:contentId
 * Get specific content item
 */
router.get('/content/item/:contentId', async (req, res) => {
  try {
    const content = await ModuleContent.findByPk(req.params.contentId);

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const [lesson] = await attachScientificReferences([content]);
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('[Learning] Content item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/content/item/:contentId/references', async (req, res) => {
  try {
    const lesson = await ModuleContent.findByPk(req.params.contentId, { attributes: ['id'] });
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
    const [withReferences] = await attachScientificReferences([lesson]);
    res.json({ success: true, data: withReferences.scientificReferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/content/item/:contentId/references', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { pmid, relevance = null } = req.body;
    const lesson = await ModuleContent.findByPk(req.params.contentId, { attributes: ['id'] });
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    const verified = await verifyPubMedReference(pmid);
    if (!verified) return res.status(404).json({ success: false, error: 'PMID was not found in PubMed.' });

    const [reference] = await ScientificReference.findOrCreate({
      where: { pmid: verified.pmid },
      defaults: { ...verified, relevance },
    });
    await reference.update({
      title: verified.title,
      authors: verified.authors,
      journal: verified.journal,
      year: verified.year,
      doi: verified.doi,
      url: verified.url,
      articleType: verified.articleType,
      abstract: verified.abstract,
      verifiedAt: verified.verifiedAt,
      ...(relevance ? { relevance } : {}),
    });
    const [link] = await LessonReference.findOrCreate({
      where: { lessonId: lesson.id, referenceId: reference.id },
      defaults: { relevance },
    });

    res.status(201).json({ success: true, data: { ...reference.toJSON(), relevance: link.relevance || reference.relevance } });
  } catch (error) {
    const status = /valid numeric PMID/.test(error.message) ? 400 : 502;
    res.status(status).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/learn/content
 * Create new content for a module
 */
router.post('/content', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      moduleId, title, contentType, description, content, videoUrl, weekNumber,
      learningObjectives, prerequisites, workedExample, biomedicalApplication,
      practicalActivity, criticalThinkingQuestion, completionRequirements,
      estimatedDurationMinutes, difficulty, orderIndex, resources, exercises, quizQuestions,
    } = req.body;

    if (!moduleId || !title || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: moduleId, title, contentType',
      });
    }

    const moduleContent = await ModuleContent.create({
      moduleId,
      title,
      description,
      contentType,
      content,
      videoUrl,
      weekNumber: Number.isInteger(Number(weekNumber)) ? Number(weekNumber) : null,
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : null,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : null,
      workedExample: workedExample && typeof workedExample === 'object' ? workedExample : null,
      biomedicalApplication: typeof biomedicalApplication === 'string' ? biomedicalApplication : null,
      practicalActivity: practicalActivity && typeof practicalActivity === 'object' ? practicalActivity : null,
      criticalThinkingQuestion: typeof criticalThinkingQuestion === 'string' ? criticalThinkingQuestion : null,
      completionRequirements: completionRequirements && typeof completionRequirements === 'object' ? completionRequirements : null,
      estimatedDurationMinutes: Number.isInteger(Number(estimatedDurationMinutes)) ? Number(estimatedDurationMinutes) : undefined,
      difficulty: difficulty || 'beginner',
      orderIndex: Number.isInteger(Number(orderIndex)) ? Number(orderIndex) : undefined,
      resources: resources || undefined,
      exercises: exercises || undefined,
      quizQuestions: quizQuestions || undefined,
      isActive: true,
    });

    res.status(201).json({ success: true, data: moduleContent });
  } catch (error) {
    console.error('[Learning] Content create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PROGRESS ROUTES ====================

router.post('/assessments/:contentId/submit', authenticateToken, async (req, res) => {
  try {
    const { moduleId, answers, questionIndices, timeSpentSeconds = 0 } = req.body;
    const userId = req.user.uuid;
    const lesson = await ModuleContent.findOne({
      where: { id: req.params.contentId, isActive: true, ...(moduleId ? { moduleId } : {}) },
    });
    if (!lesson) return res.status(404).json({ success: false, error: 'Assessment not found' });

    const graded = gradeAssessment(lesson, answers, questionIndices);
    const course = await LearningModule.findByPk(lesson.moduleId);
    const requirements = course?.masteryRequirements || {};
    const passScore = Number(requirements.assessmentPassScore ?? requirements.passScore ?? 70);
    const masteryScore = Number(requirements.masteryScore ?? 80);
    const passed = graded.score >= passScore;
    const mastered = passed && graded.score >= masteryScore;
    const status = mastered ? 'mastered' : passed ? 'completed' : 'in_progress';

    const previousAttempts = await AssessmentAttempt.count({
      where: { userId, contentId: lesson.id },
    });
    const attempt = await AssessmentAttempt.create({
      userId,
      moduleId: lesson.moduleId,
      contentId: lesson.id,
      attemptNumber: previousAttempts + 1,
      answers: Array.isArray(answers) ? answers : answers || {},
      score: graded.score,
      correctAnswers: graded.correctAnswers,
      totalQuestions: graded.totalQuestions,
      passed,
      feedback: graded.feedback,
      timeSpentSeconds: Math.max(0, Math.min(Number(timeSpentSeconds) || 0, 28800)),
    });

    let progress = await UserModuleProgress.findOne({
      where: { userId, moduleId: lesson.moduleId, contentId: lesson.id },
    });
    if (!progress) {
      progress = await UserModuleProgress.create({
        userId,
        moduleId: lesson.moduleId,
        contentId: lesson.id,
        status,
        score: graded.score,
        attempts: 1,
        correctAnswers: graded.correctAnswers,
        totalQuestions: graded.totalQuestions,
        timeSpentSeconds: attempt.timeSpentSeconds,
        xpEarned: passed ? (mastered ? 100 : 50) : 10,
        streakCount: 1,
        completedAt: passed ? new Date() : null,
        masteredAt: mastered ? new Date() : null,
      });
    } else {
      progress.attempts = (progress.attempts || 0) + 1;
      progress.score = Math.max(progress.score || 0, graded.score);
      progress.correctAnswers = graded.correctAnswers;
      progress.totalQuestions = graded.totalQuestions;
      progress.timeSpentSeconds = (progress.timeSpentSeconds || 0) + attempt.timeSpentSeconds;
      progress.status = mastered || (passed && progress.status !== 'mastered') ? status : progress.status;
      progress.lastAccessedAt = new Date();
      if (passed && !progress.completedAt) progress.completedAt = new Date();
      if (mastered && !progress.masteredAt) progress.masteredAt = new Date();
      progress.xpEarned = Math.max(progress.xpEarned || 0, mastered ? 100 : passed ? 50 : 10);
      progress.certificateEarned = mastered;
      await progress.save();
    }

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        score: graded.score,
        passed,
        mastered,
        passScore,
        masteryScore,
        correctAnswers: graded.correctAnswers,
        totalQuestions: graded.totalQuestions,
        feedback: graded.feedback,
        progress,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/progress/interactions', authenticateToken, async (req, res) => {
  try {
    const { moduleId, contentId, checklistState, quickCheckState, notes } = req.body;
    const userId = req.user.uuid;
    if (!moduleId || !contentId) {
      return res.status(400).json({ success: false, error: 'moduleId and contentId are required' });
    }

    const lesson = await ModuleContent.findOne({ where: { id: contentId, moduleId, isActive: true } });
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    let progress = await UserModuleProgress.findOne({ where: { userId, moduleId, contentId } });
    if (!progress) {
      progress = await UserModuleProgress.create({
        userId,
        moduleId,
        contentId,
        status: 'in_progress',
        score: 0,
        attempts: 0,
        timeSpentSeconds: 0,
        xpEarned: 0,
        streakCount: 0,
        metadata: {},
      });
    }

    const metadata = progress.metadata && typeof progress.metadata === 'object'
      ? { ...progress.metadata }
      : {};
    if (checklistState && typeof checklistState === 'object') metadata.checklistState = checklistState;
    if (quickCheckState !== undefined) metadata.quickCheckState = quickCheckState;
    progress.metadata = metadata;
    if (typeof notes === 'string') progress.notes = notes;
    progress.status = progress.status === 'not_started' ? 'in_progress' : progress.status;
    progress.lastAccessedAt = new Date();
    await progress.save();

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('[Learning] Interaction save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/progress/notes
 * Get user's saved notes per contentId for a module
 */
router.get('/progress/notes', authenticateToken, async (req, res) => {
  try {
    const { moduleId } = req.query;
    const userId = req.user.uuid;

    if (!moduleId) {
      return res.status(400).json({ success: false, error: 'Missing moduleId' });
    }

    const progressRows = await UserModuleProgress.findAll({
      where: {
        userId,
        moduleId,
      },
      attributes: ['contentId', 'notes'],
      raw: true,
    });

    // Normalize keys to match ModuleDetail's `item.id` (ModuleContent.id) exactly.
    const notesByContentId = {};
    (progressRows || []).forEach((row) => {
      if (!row?.contentId) return;
      const key = String(row.contentId);
      notesByContentId[key] = row?.notes || '';
    });

    // Debug: verify stored contentId values/types
    console.log('[Learning] /progress/notes debug', {
      userId,
      moduleId,
      returnedKeysSample: Object.keys(notesByContentId).slice(0, 20),
      progressRowsSample: (progressRows || []).slice(0, 5).map((r) => ({
        contentId: r?.contentId,
        contentIdType: typeof r?.contentId,
      })),
    });

    return res.json({ success: true, data: notesByContentId });
  } catch (error) {
    console.error('[Learning] Progress notes fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/progress/summary
 * Per-module lesson completion (Coursera-style course progress bars):
 * { [moduleId]: { totalLessons, completedLessons, percent, status, lastAccessedAt } }
 */
router.get('/progress/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uuid;

    const [rows] = await sequelize.query(
      `
      SELECT
        lm.id AS "moduleId",
        COUNT(DISTINCT mc.id) AS "totalLessons",
        COUNT(DISTINCT CASE WHEN ump.status IN ('completed', 'mastered') THEN mc.id END) AS "completedLessons",
        MAX(ump."lastAccessedAt") AS "lastAccessedAt"
      FROM learning_modules lm
      JOIN module_contents mc ON mc."moduleId" = lm.id AND mc."isActive" = true
      LEFT JOIN user_module_progress ump
        ON ump."moduleId" = lm.id AND ump."contentId" = mc.id AND ump."userId" = :userId
      WHERE lm."isActive" = true AND (lm.status = 'published' OR lm.status IS NULL)
      GROUP BY lm.id
      `,
      { replacements: { userId } }
    );

    const summary = {};
    rows.forEach((r) => {
      const total = Number(r.totalLessons) || 0;
      const completed = Number(r.completedLessons) || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      summary[r.moduleId] = {
        totalLessons: total,
        completedLessons: completed,
        percent,
        status: percent === 100 && total > 0 ? 'completed' : percent > 0 ? 'in_progress' : 'not_started',
        lastAccessedAt: r.lastAccessedAt,
      };
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[Learning] Progress summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/progress
 * Get user's learning progress
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    // Ensure user is authenticated and userId is available
    if (!req.user || !req.user.uuid) {
      console.error('[Learning] Progress fetch error: User not authenticated or UUID missing.');
      return res.status(401).json({ success: false, error: 'Authentication required or user ID missing.' });
    }

    const { moduleId, category, status } = req.query;
    const userId = req.user.uuid;

    const where = { userId };
    if (moduleId) where.moduleId = moduleId;
    if (status) where.status = status;

    let progressData = await UserModuleProgress.findAll({
      where,
      include: [{ model: LearningModule, attributes: ['title', 'category', 'difficulty'] }],
      order: [['lastAccessedAt', 'DESC']],
    });

    // Filter by category if specified
    if (category) {
      progressData = progressData.filter((p) => p.LearningModule.category === category);
    }

    // Calculate stats
    const stats = {
      totalModules: progressData.length,
      completed: progressData.filter((p) => p.status === 'completed').length,
      mastered: progressData.filter((p) => p.status === 'mastered').length,
      inProgress: progressData.filter((p) => p.status === 'in_progress').length,
      totalXp: progressData.reduce((sum, p) => sum + (p.xpEarned || 0), 0),
      totalTimeSeconds: progressData.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0),
      currentStreak: Math.max(...progressData.map((p) => p.streakCount || 0), 0),
      averageScore: progressData.length > 0 
        ? Math.round(progressData.reduce((sum, p) => sum + (p.score || 0), 0) / progressData.length)
        : 0,
    };

    res.json({ success: true, data: progressData, stats });
  } catch (error) {
    console.error('[Learning] Progress fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/learn/progress
 * Update module progress
 */
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { moduleId, contentId, timeSpentSeconds, status, notes } = req.body;

    const userId = req.user.uuid;

    if (!moduleId) {
      return res.status(400).json({ success: false, error: 'Missing moduleId' });
    }
    if (!contentId) {
      return res.status(400).json({ success: false, error: 'Missing contentId' });
    }

    // Normalize to string UUID for consistent lookups.
    const normalizedModuleId = String(moduleId);
    const normalizedContentId = String(contentId);
    const lesson = await ModuleContent.findOne({
      where: { id: normalizedContentId, moduleId: normalizedModuleId, isActive: true },
    });
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found in this course' });
    }
    if (lesson.contentType === 'quiz') {
      return res.status(400).json({ success: false, error: 'Submit quiz answers through the assessment endpoint' });
    }
    const safeStatus = status === 'completed' || status === 'mastered' ? 'completed' : 'in_progress';

    let progress = await UserModuleProgress.findOne({
      where: { userId, moduleId: normalizedModuleId, contentId: normalizedContentId },
    });

    if (progress) {
      // Update existing
      progress.attempts += 1;
      progress.status = progress.status === 'mastered' ? 'mastered' : safeStatus;
      if (safeStatus === 'completed' && !progress.completedAt) progress.completedAt = new Date();
      if (timeSpentSeconds !== undefined) {
        progress.timeSpentSeconds += timeSpentSeconds;
      }
      if (typeof notes === 'string') {
        progress.notes = notes;
      }
      // Ensure the row always stays aligned with incoming identity.
      progress.moduleId = normalizedModuleId;
      progress.contentId = normalizedContentId;

      progress.lastAccessedAt = new Date();

      await progress.save();
    } else {
      // Create new
      progress = await UserModuleProgress.create({
        userId,
        moduleId: normalizedModuleId,
        contentId: normalizedContentId,
        status: safeStatus,
        ...(typeof notes === 'string' ? { notes } : {}),

        score: 0,
        attempts: 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        xpEarned: safeStatus === 'completed' ? 20 : 0,
        streakCount: 0,
        ...(safeStatus === 'completed' ? { completedAt: new Date() } : {}),
      });
    }

    return res.json({ success: true, data: progress });
  } catch (error) {
    console.error('[Learning] Progress update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/certificates
 * Get user's earned certificates — awarded when every lesson in a module
 * has been completed/mastered (course-level completion, not a single quiz).
 */
router.get('/certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uuid;

    const [rows] = await sequelize.query(
      `
      SELECT
        lm.id AS "moduleId",
        lm.title,
        lm.category,
        lm.subcategory,
        lm.difficulty,
        COUNT(DISTINCT mc.id) AS "totalLessons",
        COUNT(DISTINCT CASE WHEN ump.status IN ('completed', 'mastered') THEN mc.id END) AS "completedLessons",
        MAX(ump."lastAccessedAt") AS "completedAt"
      FROM learning_modules lm
      JOIN module_contents mc ON mc."moduleId" = lm.id AND mc."isActive" = true
      JOIN user_module_progress ump
        ON ump."moduleId" = lm.id AND ump."contentId" = mc.id AND ump."userId" = :userId
        AND ump.status IN ('completed', 'mastered')
      WHERE lm."isActive" = true AND (lm.status = 'published' OR lm.status IS NULL)
      GROUP BY lm.id, lm.title, lm.category, lm.subcategory, lm.difficulty
      HAVING COUNT(DISTINCT mc.id) = COUNT(DISTINCT CASE WHEN ump.status IN ('completed', 'mastered') THEN mc.id END)
      ORDER BY MAX(ump."lastAccessedAt") DESC
      `,
      { replacements: { userId } }
    );

    const certificates = rows.map((r) => ({
      moduleId: r.moduleId,
      title: r.title,
      category: r.category,
      subcategory: r.subcategory,
      difficulty: r.difficulty,
      totalLessons: Number(r.totalLessons) || 0,
      completedAt: r.completedAt,
    }));

    res.json({
      success: true,
      data: certificates,
      totalCertificates: certificates.length,
    });
  } catch (error) {
    console.error('[Learning] Certificates fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/learn/categories
 * Get learning categories and their statistics
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'CORE_AI',
      'APPLIED_AI',
      'AI_ENGINEERING',
      'BIOLOGY',
      'CHEMISTRY',
      'PHYSICS_MATHS',
      'CORE_BIOINFORMATICS',
      'ADVANCED_BIOINFORMATICS',
    ];

    const stats = await Promise.all(
      categories.map(async (cat) => {
        const modules = await LearningModule.count({
          where: {
            category: cat,
            isActive: true,
            [Op.or]: [{ status: 'published' }, { status: null }],
          },
        });
        return { category: cat, moduleCount: modules };
      })
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Learning] Categories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
