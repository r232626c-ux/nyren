const { analyzeEmotion } = require('../services/ollama');

async function detectEmotion(text) {
  // Use ollama for advanced emotion detection
  return await analyzeEmotion(text);
}

function simpleEmotionDetection(text) {
  // Fallback simple keyword-based detection
  const lowerText = text.toLowerCase();

  if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('awesome')) {
    return 'excited';
  } else if (lowerText.includes('sad') || lowerText.includes('sorry') || lowerText.includes('unfortunate')) {
    return 'sad';
  } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('annoyed')) {
    return 'angry';
  } else if (lowerText.includes('worried') || lowerText.includes('concerned') || lowerText.includes('anxious')) {
    return 'anxious';
  } else if (lowerText.includes('calm') || lowerText.includes('relaxed') || lowerText.includes('peaceful')) {
    return 'calm';
  }

  return 'neutral';
}

function adjustResponseStyle(mood) {
  const styles = {
    excited: { temperature: 0.8, style: 'enthusiastic' },
    sad: { temperature: 0.6, style: 'empathetic' },
    angry: { temperature: 0.5, style: 'calming' },
    anxious: { temperature: 0.6, style: 'reassuring' },
    calm: { temperature: 0.7, style: 'balanced' },
    neutral: { temperature: 0.7, style: 'neutral' }
  };

  return styles[mood] || styles.neutral;
}

module.exports = { detectEmotion, simpleEmotionDetection, adjustResponseStyle };