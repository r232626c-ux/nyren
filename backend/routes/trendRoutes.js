const express = require('express');
const { getTrends } = require('../controllers/trendController');

const router = express.Router();

// GET /api/trends
router.get('/', getTrends);

module.exports = router;