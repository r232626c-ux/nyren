const TrendHistory = require('../models/TrendHistory');
const { generateTrendPrediction } = require('../services/trendService');

/**
 * Get trend predictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrends = async (req, res) => {
  try {
    // Get existing trends
    const trends = await TrendHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Generate new prediction
    const newPrediction = await generateTrendPrediction();

    // Save to database
    const savedTrend = await TrendHistory.create(newPrediction);

    res.json({
      trends,
      latestPrediction: savedTrend,
    });
  } catch (error) {
    console.error('Error in getTrends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTrends,
};