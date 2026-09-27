const { predictTrends } = require('../agents/analyst');
const TrendHistory = require('../models/TrendHistory');

async function generatePredictions() {
  try {
    const predictionsText = await predictTrends();

    // Parse predictions and save to database
    // This is a simplified version - in production, parse the AI response
    const prediction = new TrendHistory({
      prediction: predictionsText,
      confidenceScore: 75 // Default confidence
    });

    await prediction.save();
    return prediction;
  } catch (error) {
    console.error('Trend prediction generation error:', error);
    return null;
  }
}

async function getRecentPredictions(limit = 10) {
  try {
    return await TrendHistory.find().sort({ timestamp: -1 }).limit(limit);
  } catch (error) {
    console.error('Get recent predictions error:', error);
    return [];
  }
}

async function updatePredictionOutcome(predictionId, outcome) {
  try {
    await TrendHistory.findByIdAndUpdate(predictionId, { outcome });
  } catch (error) {
    console.error('Update prediction outcome error:', error);
  }
}

module.exports = { generatePredictions, getRecentPredictions, updatePredictionOutcome };