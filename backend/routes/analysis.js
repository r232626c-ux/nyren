const express = require('express');
const router = express.Router();
const {
  submitAnalysisJob,
  getAnalysisJobStatus,
  getAnalysisJobResult,
  listAnalysisJobs,
} = require('../controllers/analysisController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { analysisLimiter, userAnalysisLimiter } = require('../middleware/rateLimit');
const { validateAnalysisRequest, validateJobId } = require('../middleware/validation');

// Apply authentication only to analysis-related routes.
// This router is mounted at /api, so non-analysis paths like /api/billing must pass through.
router.use((req, res, next) => {
  if (!req.path.startsWith('/analysis') && req.path !== '/jobs') {
    return next(); // Ignore unrelated /api routes
  }

  if (req.path === '/jobs' || req.path.startsWith('/analysis/jobs')) {
    return next(); // Skip auth for analysis job operations and job listing
  }

  return authenticateToken(req, res, next);
});

// Analysis job submission with rate limiting and validation
router.post('/analysis/jobs', analysisLimiter, userAnalysisLimiter, validateAnalysisRequest, submitAnalysisJob);

// Job status and results with validation
router.get('/analysis/jobs/:jobId', validateJobId, getAnalysisJobStatus);
router.get('/analysis/jobs/:jobId/result', validateJobId, getAnalysisJobResult);

// List jobs (user-specific)
router.get('/analysis/jobs', listAnalysisJobs);
router.get('/jobs', listAnalysisJobs);

module.exports = router;
