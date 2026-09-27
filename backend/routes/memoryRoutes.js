const express = require("express");
const {
  getMemories,
  saveResearchMemory,
  getResearchMemory,
} = require("../controllers/memoryController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

/* ---------------- CORE MEMORY ---------------- */

// GET all memory (SAFE)
router.get("/", optionalAuth, getMemories);

// RESEARCH MEMORY
router.get("/research/:userId", optionalAuth, getResearchMemory);
router.post("/research/:userId", optionalAuth, saveResearchMemory);

module.exports = router;