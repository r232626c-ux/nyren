const express = require("express");
const router = express.Router();

const aiService = require("../services/aiService");
const Conversation = require("../models/Conversation");
const { Op } = require("sequelize");
const { optionalAuth } = require("../middleware/auth");
const { findUserByIdentifier, getOrCreateUserByExternalId } = require("../utils/userUuidHelper");

router.post("/", optionalAuth, async (req, res) => {
  try {
    const { message, userId: requestUserId, mode = "chat", max_tokens, local_only = false, language, threadId } = req.body;
    const userId = req.user?.uuid || requestUserId;

    if (!message || !userId) {
      return res.status(400).json({
        status: "error",
        message: "message and userId are required",
      });
    }

    const user = req.user
      ? await findUserByIdentifier(req.user.uuid)
      : await getOrCreateUserByExternalId(userId, { name: `User_${userId}`, email: `${userId}@coli.local` });
    const threadHistory = threadId
      ? await Conversation.findAll({
          where: { userId: user.id, threadId },
          order: [["createdAt", "DESC"]],
          limit: 12,
        })
      : [];
    const result = await aiService.processMessage(
      message,
      userId,
      mode,
      max_tokens,
      local_only,
      language,
      threadHistory.reverse().flatMap((turn) => [
        { role: "user", content: turn.message },
        ...(turn.coli_response ? [{ role: "assistant", content: turn.coli_response }] : []),
      ])
    );

    const savedTurn = await Conversation.create({
      userId: user.id,
      message,
      coli_response: result.answer,
      sources: result.sources || [],
      reasoning: result.reasoning || [],
      mode,
      threadId: threadId || null,
    });

    res.json({
      status: result.status,
      answer: result.answer,
      provider: result.provider || "unknown",
      sources: result.sources || [],
      reasoning: result.reasoning || [],
      mode,
      threadId: threadId || null,
      conversationId: savedTurn.id,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/turns", optionalAuth, async (req, res) => {
  try {
    const { message, answer, userId: requestUserId, threadId, mode = "chat" } = req.body;
    const userId = req.user?.uuid || requestUserId;
    if (!message || typeof answer !== "string" || !userId) {
      return res.status(400).json({ status: "error", message: "message, answer, and userId are required" });
    }

    const user = req.user
      ? await findUserByIdentifier(req.user.uuid)
      : await getOrCreateUserByExternalId(userId, { name: `User_${userId}`, email: `${userId}@coli.local` });
    const savedTurn = await Conversation.create({
      userId: user.id,
      message,
      coli_response: answer,
      mode,
      threadId: threadId || null,
    });

    res.status(201).json({ status: "success", conversationId: savedTurn.id, threadId: threadId || null });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/threads", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.uuid || req.query.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Authentication required" });
    const user = req.user
      ? await findUserByIdentifier(req.user.uuid)
      : await getOrCreateUserByExternalId(userId, { name: `User_${userId}`, email: `${userId}@coli.local` });
    const rows = await Conversation.findAll({
      where: { userId: user.id },
      attributes: ["id", "threadId", "message", "coli_response", "mode", "isImportant", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 500,
    });
    const threads = new Map();
    for (const row of rows) {
      const id = row.threadId || row.id;
      const thread = threads.get(id) || {
        id,
        title: row.message,
        createdAt: row.createdAt,
        turns: 0,
        isImportant: false,
      };
      thread.turns += 1;
      thread.isImportant = thread.isImportant || row.isImportant;
      if (new Date(row.createdAt) > new Date(thread.createdAt)) thread.createdAt = row.createdAt;
      threads.set(id, thread);
    }
    res.json({ status: "success", threads: [...threads.values()] });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/threads/:threadId", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.uuid || req.query.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Authentication required" });
    const user = req.user
      ? await findUserByIdentifier(req.user.uuid)
      : await getOrCreateUserByExternalId(userId, { name: `User_${userId}`, email: `${userId}@coli.local` });
    const rows = await Conversation.findAll({
      where: {
        userId: user.id,
        [Op.or]: [{ threadId: req.params.threadId }, { id: req.params.threadId, threadId: null }],
      },
      order: [["createdAt", "ASC"]],
    });
    res.json({ status: "success", turns: rows });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.patch("/turns/:id/important", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.uuid || req.body.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Authentication required" });
    const user = req.user
      ? await findUserByIdentifier(req.user.uuid)
      : await getOrCreateUserByExternalId(userId, { name: `User_${userId}`, email: `${userId}@coli.local` });
    const turn = await Conversation.findOne({ where: { id: req.params.id, userId: user.id } });
    if (!turn) return res.status(404).json({ status: "error", message: "Chat turn not found" });
    turn.isImportant = Boolean(req.body.isImportant);
    await turn.save();
    res.json({ status: "success", isImportant: turn.isImportant });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;