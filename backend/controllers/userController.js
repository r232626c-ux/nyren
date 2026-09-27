const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/passwordUtil');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const sanitizeUser = (user) => {
  if (!user) return null;
  const { id, uuid, name, email, bondLevel, role, createdAt, updatedAt } = user;
  return { id, uuid, name, email, bondLevel, role, createdAt, updatedAt };
};

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const userData = { name, email };
    if (password) {
      userData.passwordHash = hashPassword(password);
    }

    const user = await User.create(userData);
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Error in createUser:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getUser,
};