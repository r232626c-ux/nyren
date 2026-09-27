const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for analysis endpoints
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 analysis requests per hour
  message: {
    error: 'Analysis request limit exceeded. Please wait before submitting another analysis.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 uploads per hour
  message: {
    error: 'Upload limit exceeded. Please wait before uploading another file.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User-specific rate limiter (requires authentication)
const createUserLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.user ? req.user.id : req.ip;
    },
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const userAnalysisLimiter = createUserLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 analysis jobs per user per hour
  'User analysis limit exceeded. Please wait before submitting another analysis.'
);

module.exports = {
  apiLimiter,
  analysisLimiter,
  uploadLimiter,
  userAnalysisLimiter,
};