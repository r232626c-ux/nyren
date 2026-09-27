const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/passwordUtil');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const sanitizeUser = (user) => {
  if (!user) return null;
  const { id, uuid, name, email, bondLevel, role, createdAt, updatedAt } = user;
  return { id, uuid, name, email, bondLevel, role, createdAt, updatedAt };
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
    });

    const token = jwt.sign({ userId: user.uuid || user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.uuid || user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.json({ user: req.user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
