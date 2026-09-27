const Conversation = require('../models/Conversation');
const { findUserByIdentifier, getOrCreateUserByExternalId } = require('../utils/userUuidHelper');

async function resolveUserId(userId, createIfMissing = false) {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (createIfMissing) {
    const user = await getOrCreateUserByExternalId(userId, {
      name: 'Coli User',
      email: `${userId}@coli.local`,
    });
    return user.id; // Return integer id for database compatibility
  }

  const user = await findUserByIdentifier(userId);
  return user ? user.id : null; // Return integer id
}

/**
 * Save a conversation to memory
 * @param {string} userId - The user ID (string or UUID)
 * @param {string} message - The user's message
 * @param {string} response - Coli's response
 * @returns {Promise<Conversation>} The saved conversation
 */
async function saveConversation(userId, message, response) {
  try {
    const safeUserId = await resolveUserId(userId, true);

    const conversation = await Conversation.create({
      userId: safeUserId,
      message,
      coli_response: response,
    });

    console.log(`[Memory] Saved conversation for user ${userId}: ${message.substring(0, 50)}...`);
    return conversation;
  } catch (error) {
    console.error('[Memory] Error saving conversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for a user
 * @param {string} userId - The user ID (string or UUID)
 * @param {number} limit - Maximum number of conversations to retrieve
 * @returns {Promise<Conversation[]>} Array of conversations
 */
async function getConversationHistory(userId, limit = 10) {
  try {
    const safeUserId = await resolveUserId(userId);
    if (!safeUserId) {
      return [];
    }

    const conversations = await Conversation.findAll({
      where: { userId: safeUserId },
      order: [['createdAt', 'DESC']],
      limit,
    });

    console.log(`[Memory] Retrieved ${conversations.length} conversations for user ${userId}`);
    return conversations;
  } catch (error) {
    console.error('[Memory] Error retrieving conversation history:', error);
    throw error;
  }
}

/**
 * Get conversation context for AI (formatted for prompts)
 * @param {string} userId - The user ID (string or UUID)
 * @param {number} limit - Maximum number of conversations to include in context
 * @returns {Promise<string>} Formatted conversation context
 */
async function getConversationContext(userId, limit = 5) {
  try {
    const history = await getConversationHistory(userId, limit);

    const context = history
      .reverse()
      .map((msg) => `User: ${msg.message}\nColi: ${msg.coli_response || 'Thinking...'}`)
      .join('\n\n');

    return context;
  } catch (error) {
    console.error('[Memory] Error building conversation context:', error);
    return '';
  }
}

/**
 * Clear conversation history for a user
 * @param {string} userId - The user ID (string or UUID)
 * @returns {Promise<number>} Number of deleted conversations
 */
async function clearConversationHistory(userId) {
  try {
    const safeUserId = await resolveUserId(userId);
    if (!safeUserId) {
      return 0;
    }

    const deletedCount = await Conversation.destroy({
      where: { userId: safeUserId },
    });

    console.log(`[Memory] Cleared ${deletedCount} conversations for user ${userId}`);
    return deletedCount;
  } catch (error) {
    console.error('[Memory] Error clearing conversation history:', error);
    throw error;
  }
}

module.exports = {
  saveConversation,
  getConversationHistory,
  getConversationContext,
  clearConversationHistory,
};