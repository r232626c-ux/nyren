const jwt = require('jsonwebtoken');
const validator = require('validator');
const { User } = require('../models');
const { getSafeUserUuid, ensureUserUuid } = require('../utils/userUuidHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    console.log('[AUTH DEBUG] JWT_SECRET length:', JWT_SECRET.length);
    console.log('[AUTH DEBUG] JWT_SECRET used:', JWT_SECRET.substring(0, 20) + '...');
    console.log('[AUTH DEBUG] Token received:', token.substring(0, 50) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user exists by UUID or legacy integer ID
    let user;
    if (validator.isUUID(String(decoded.userId))) {
      user = await User.findOne({ where: { uuid: decoded.userId } });
    } else {
      user = await User.findByPk(Number(decoded.userId));
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const uuid = await ensureUserUuid(user);

    req.user = {
      id: user.id,
      uuid,
      email: user.email,
      role: user.role || 'user',
    };

    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// For public routes that personalize the response when a valid token is
// present (e.g. "did I like this post?") but must still work for guests.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let user;
    if (validator.isUUID(String(decoded.userId))) {
      user = await User.findOne({ where: { uuid: decoded.userId } });
    } else {
      user = await User.findByPk(Number(decoded.userId));
    }

    req.user = user ? { id: user.id, uuid: await ensureUserUuid(user), email: user.email, role: user.role || 'user' } : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  JWT_SECRET,
};