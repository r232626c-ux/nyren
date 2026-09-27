/**
 * Basic emotion detection service
 * Analyzes text to detect mood and tone
 * @param {string} text - The text to analyze
 * @returns {Object} - Object with mood and tone
 */
const detectEmotion = (text) => {
  const lowerText = text.toLowerCase();

  let mood = 'neutral';
  let tone = 'calm';

  // Simple keyword-based detection
  if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) {
    mood = 'happy';
    tone = 'positive';
  } else if (lowerText.includes('sad') || lowerText.includes('unhappy') || lowerText.includes('depressed')) {
    mood = 'sad';
    tone = 'negative';
  } else if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('frustrated')) {
    mood = 'angry';
    tone = 'aggressive';
  } else if (lowerText.includes('love') || lowerText.includes('affection')) {
    mood = 'loving';
    tone = 'warm';
  }

  return { mood, tone };
};

module.exports = {
  detectEmotion,
};