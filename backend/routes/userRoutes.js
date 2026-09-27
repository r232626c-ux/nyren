const express = require('express');
const { createUser, getUser } = require('../controllers/userController');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// GET /api/users/profile
router.get('/profile', authenticateToken, getProfile);

// POST /api/users
router.post('/', createUser);

// GET /api/users/:id
router.get('/:id', getUser);

module.exports = router;