/**
 * Vector Memory Service
 * Stores conversation memories with embeddings for semantic search
 * Enables persistent, contextual memory across conversations
 */

const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const axios = require('axios');
const { getSafeUserUuid } = require('../utils/userUuidHelper');

// ============ VECTOR MEMORY MODEL ============
const VectorMemory = sequelize.define('VectorMemory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  embedding: {
    type: DataTypes.JSON, // Store embedding vector as JSON array
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general', // preferences, facts, tasks, conversations
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  importance: {
    type: DataTypes.FLOAT,
    defaultValue: 0.5, // 0-1 scale
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastAccessed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// ============ EMBEDDING GENERATION ============

/**
 * Generate embedding for text using ollama
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} Embedding vector
 */
async function generateEmbedding(text) {
  try {
    if (!process.env.ollama_API_KEY) {
      console.warn('[VECTOR MEMORY] ollama key not configured, using mock embedding');
      return generateMockEmbedding(text);
    }

    const response = await axios.post(
      'https://api.ollama.com/v1/embeddings',
      {
        model: 'text-embedding-3-small', // Faster, cheaper embeddings
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ollama_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('[VECTOR MEMORY] Embedding error:', error.message);
    return generateMockEmbedding(text);
  }
}

/**
 * Generate mock embedding for development
 * Simple hash-based vector generation
 */
function generateMockEmbedding(text) {
  const embedding = [];
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate 384-dimensional vector (matching text-embedding-3-small)
  for (let i = 0; i < 384; i++) {
    embedding.push(Math.sin(hash * i / 384) * 0.5);
  }

  return embedding;
}

// ============ MEMORY OPERATIONS ============

/**
 * Save memory with embedding
 * @param {string} userId - User ID
 * @param {string} content - Memory content
 * @param {string} category - Memory category
 * @param {object} metadata - Additional metadata
 * @returns {Promise<VectorMemory>} Saved memory
 */
async function saveMemory(userId, content, category = 'general', metadata = {}) {
  try {
    const safeUserId = await getSafeUserUuid(userId);
    console.log(`[VECTOR MEMORY] Saving memory for user ${safeUserId}, category: ${category}`);

    const embedding = await generateEmbedding(content);

    const memory = await VectorMemory.create({
      userId: safeUserId,
      content,
      embedding,
      category,
      metadata,
      importance: calculateImportance(category),
    });

    console.log(`[VECTOR MEMORY] Memory saved with ID: ${memory.id}`);
    return memory;
  } catch (error) {
    console.error('[VECTOR MEMORY] Error saving memory:', error);
    throw error;
  }
}

/**
 * Search memory by semantic similarity
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Similar memories
 */
async function searchMemory(userId, query, topK = 5) {
  try {
    const safeUserId = await getSafeUserUuid(userId);
    console.log(`[VECTOR MEMORY] Searching memory for user ${safeUserId}: "${query}"`);

    const queryEmbedding = await generateEmbedding(query);

    // Get all memories for user
    const memories = await VectorMemory.findAll({
      where: { userId: safeUserId },
      order: [['lastAccessed', 'DESC']],
      limit: 100, // Reasonable limit for similarity search
    });

    if (memories.length === 0) {
      console.log('[VECTOR MEMORY] No memories found for user');
      return [];
    }

    // Calculate similarity scores
    const scored = memories.map((mem) => ({
      ...mem.toJSON(),
      similarity: cosineSimilarity(queryEmbedding, mem.embedding || []),
    }));

    // Sort by similarity and return top K
    const results = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`[VECTOR MEMORY] Found ${results.length} similar memories`);

    // Update access count
    for (const result of results) {
      await VectorMemory.update(
        {
          accessCount: result.accessCount + 1,
          lastAccessed: new Date(),
        },
        { where: { id: result.id } }
      );
    }

    return results;
  } catch (error) {
    console.error('[VECTOR MEMORY] Error searching memory:', error);
    return [];
  }
}

/**
 * Get recent memories for user
 * @param {string} userId - User ID
 * @param {number} limit - Number of memories to retrieve
 * @returns {Promise<Array>} Recent memories
 */
async function getRecentMemories(userId, limit = 10) {
  try {
    const safeUserId = await getSafeUserUuid(userId);
    const memories = await VectorMemory.findAll({
      where: { userId: safeUserId },
      order: [['createdAt', 'DESC']],
      limit,
    });

    return memories.map((m) => m.toJSON());
  } catch (error) {
    console.error('[VECTOR MEMORY] Error getting recent memories:', error);
    return [];
  }
}

/**
 * Get memory context for system prompt
 * @param {string} userId - User ID
 * @param {number} limit - Number of memories to include
 * @returns {Promise<string>} Formatted memory context
 */
async function getMemoryContext(userId, limit = 5) {
  try {
    const memories = await getRecentMemories(userId, limit);

    if (memories.length === 0) {
      return 'No previous memories.';
    }

    const context = memories
      .map((mem) => `[${mem.category}] ${mem.content}`)
      .join('\n');

    return context;
  } catch (error) {
    console.error('[VECTOR MEMORY] Error building memory context:', error);
    return '';
  }
}

/**
 * Delete memory
 * @param {string} memoryId - Memory ID to delete
 * @returns {Promise<number>} Number of deleted records
 */
async function deleteMemory(memoryId) {
  try {
    return await VectorMemory.destroy({
      where: { id: memoryId },
    });
  } catch (error) {
    console.error('[VECTOR MEMORY] Error deleting memory:', error);
    throw error;
  }
}

/**
 * Clear all memories for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of deleted records
 */
async function clearUserMemories(userId) {
  try {
    const safeUserId = await getSafeUserUuid(userId);
    const deleted = await VectorMemory.destroy({
      where: { userId: safeUserId },
    });

    console.log(`[VECTOR MEMORY] Cleared ${deleted} memories for user ${userId}`);
    return deleted;
  } catch (error) {
    console.error('[VECTOR MEMORY] Error clearing user memories:', error);
    throw error;
  }
}

// ============ SIMILARITY CALCULATION ============

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {Array} vecA - First embedding vector
 * @param {Array} vecB - Second embedding vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate importance score based on category
 */
function calculateImportance(category) {
  const importanceMap = {
    preferences: 0.9,
    tasks: 0.8,
    facts: 0.7,
    conversations: 0.5,
    general: 0.5,
  };

  return importanceMap[category] || 0.5;
}

module.exports = {
  VectorMemory,
  saveMemory,
  searchMemory,
  getRecentMemories,
  getMemoryContext,
  deleteMemory,
  clearUserMemories,
  generateEmbedding,
  cosineSimilarity,
};
