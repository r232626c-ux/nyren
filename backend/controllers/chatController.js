const { generateChatResponse } = require('../services/aiService');
const { searchInternet } = require('../services/searchServiceEnhanced');
const { detectEmotion } = require('../services/emotionService');
const EmotionalMemory = require('../models/EmotionalMemory');
const { getOrCreateUserByExternalId } = require('../utils/userUuidHelper');
const { saveConversation, getConversationContext } = require('../services/memoryService');

/**
 * Fast parallel response using search + AI in parallel
 * @param {string} query - User query
 * @returns {Promise<Object>} - Combined response with answer and sources
 */
const fastResponse = async (query) => {
  try {
    // Run search and AI in parallel for maximum speed
    const [searchData, aiData] = await Promise.all([
      searchInternet(query).catch((err) => {
        console.warn('[FastResponse] Search failed, using AI only:', err.message);
        return { answer: null, sources: [] };
      }),
      generateChatResponse(query),
    ]);

    // Prefer search data if available, fallback to AI
    return {
      answer: searchData.answer || aiData.reply,
      sources: searchData.sources || [],
      mode: searchData.answer ? 'hybrid' : 'ai',
    };
  } catch (error) {
    console.error('[FastResponse] Error:', error);
    return {
      answer: 'I encountered an error but I\'m ready to try again.',
      sources: [],
      mode: 'error',
    };
  }
};

/**
 * Handle chat request with fast parallel responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleChat = async (req, res) => {
  try {
    const { message, userId, language } = req.body;


    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }




    // Generate fast response immediately while resolving or creating the user record
    const [user, { answer, sources, mode }] = await Promise.all([
      getOrCreateUserByExternalId(userId, {
        name: 'Coli User',
        email: `${userId}@coli.local`,
      }),
      fastResponse(message),
    ]);

    // If a target language is selected (e.g. Shona), translate the final answer.
    // NOTE: chatController previously ignored req.body.language, so language selection on the mobile app had no effect.
    let translatedAnswer = answer;
    if (language && language !== 'auto' && typeof answer === 'string' && answer.trim()) {
      try {
        const { translateText } = require('../services/aiService');
        translatedAnswer = await translateText(answer, language);
      } catch (err) {
        console.warn('[Chat] answer translation failed:', err?.message || err);
      }
    }


    // Detect emotion
    const { mood, tone } = detectEmotion(message);

    // Save to memory asynchronously (don't wait for response)
    saveConversation(userId, message, translatedAnswer).catch((err) =>
      console.error('[Chat] Memory save failed:', err)
    );
    EmotionalMemory.create({
      mood,
      tone,
      trigger: message,
      response: translatedAnswer,
      userId: user.id, // Use integer id
    }).catch((err) => console.error('[Chat] Emotion save failed:', err));


    console.log(`[Chat] ⚡ Fast response for user ${userId}: ${message.substring(0, 50)}...`);

    res.json({
      reply: translatedAnswer,
      sources: sources,
      mode: mode,
      mood,
      tone,
    });

  } catch (error) {
    console.error('[Chat] Error processing chat request:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
};

module.exports = {
  handleChat,
  fastResponse,
};