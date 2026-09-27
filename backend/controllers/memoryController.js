const Conversation = require("../models/Conversation");
const EmotionalMemory = require("../models/EmotionalMemory");
const ResearchMemory = require("../models/ResearchMemory");
const Document = require("../models/Document");
const {
  findUserByIdentifier,
  getOrCreateUserByExternalId,
} = require("../utils/userUuidHelper");

/* ---------------- SAFE GET MEMORIES ---------------- */

const getMemories = async (req, res) => {
  try {
    const userId = req.user?.uuid || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId required",
        conversations: [],
        emotionalMemories: [],
        researchMemories: [],
      });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: `User_${userId}`,
      email: `${userId}@coli.local`,
    });

    const dbUserId = user?.id; // Use integer id for database queries

    // SAFE FALLBACKS (THIS FIXES YOUR CRASH)
    const conversations = await Conversation.findAll({
      where: { userId: dbUserId },
      order: [["createdAt", "DESC"]],
    }).catch(() => []);

    const emotionalMemories = await EmotionalMemory.findAll({
      where: { userId: dbUserId },
      order: [["createdAt", "DESC"]],
      limit: 10,
    }).catch(() => []);

    const researchMemoriesRaw = await ResearchMemory.findAll({
      where: { userId: dbUserId },
      order: [["createdAt", "DESC"]],
    }).catch(() => []);
    const documents = await Document.findAll({
      where: { userId: dbUserId },
      attributes: ["id", "name", "mimeType", "createdAt"],
      order: [["createdAt", "DESC"]],
    }).catch(() => []);

    const normalizedConversations = conversations.map((conversation) => ({
      id: conversation.id,
      userInput: conversation.message,
      coliResponse: conversation.coli_response,
      timestamp: conversation.createdAt,
      threadId: conversation.threadId,
      isImportant: conversation.isImportant,
    }));

    // NORMALIZE (CRITICAL FIX)
    const researchMemories = researchMemoriesRaw.map((r) => ({
      id: r.id,
      ideas: Array.isArray(r.ideas) ? r.ideas : [],
      experiments: r.experiments || [],
      notes: r.notes || "",
    }));

    return res.json({
      conversations: normalizedConversations,
      emotionalMemories: emotionalMemories || [],
      researchMemories,
      documents,
      bondLevel: user?.bondLevel || 0,
    });
  } catch (error) {
    console.error("getMemories ERROR:", error);

    return res.status(500).json({
      error: "Internal server error",
      conversations: [],
      emotionalMemories: [],
      researchMemories: [],
    });
  }
};

/* ---------------- SAVE RESEARCH ---------------- */

const saveResearchMemory = async (req, res) => {
  try {
    const userId = req.user?.uuid || req.params.userId;
    const { ideas = [], experiments = [], notes = "" } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const user = await getOrCreateUserByExternalId(userId, {
      name: `User_${userId}`,
      email: `${userId}@coli.local`,
    });

    if (!user || !user.uuid) {
      return res.status(500).json({
        error: "Failed to create or find user",
      });
    }

    // Validate inputs
    const validIdeas = Array.isArray(ideas) ? ideas : [];
    const validExperiments = Array.isArray(experiments) ? experiments : [];
    const validNotes = typeof notes === "string" ? notes : "";

    // Check if ResearchMemory model exists
    if (!ResearchMemory || !ResearchMemory.create) {
      console.error("[MEMORY] ResearchMemory model not properly initialized");
      return res.status(500).json({
        error: "Memory service not available",
      });
    }

    const entry = await ResearchMemory.create({
      userId: user.id, // Use integer id
      ideas: validIdeas,
      experiments: validExperiments,
      notes: validNotes,
    });

    return res.status(201).json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error("[MEMORY ERROR]", error.message, error.stack);

    return res.status(500).json({
      error: "Failed to save research memory",
      message: error.message,
    });
  }
};

/* ---------------- GET RESEARCH ONLY ---------------- */

const getResearchMemory = async (req, res) => {
  try {
    const userId = req.user?.uuid || req.params.userId;

    const user = await findUserByIdentifier(userId);

    const researchMemories = await ResearchMemory.findAll({
      where: { userId: user?.id || null }, // Use integer id
      order: [["createdAt", "DESC"]],
      limit: 10,
    }).catch(() => []);

    return res.json(researchMemories || []);
  } catch (error) {
    console.error("getResearchMemory ERROR:", error);

    return res.status(500).json([]);
  }
};

module.exports = {
  getMemories,
  saveResearchMemory,
  getResearchMemory,
};