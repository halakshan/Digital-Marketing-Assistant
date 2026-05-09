const express = require("express");
const router  = express.Router();
const { generateContent, getHistory, getUsage } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/ai/generate  → generate AI content
router.post("/generate", protect, generateContent);

// GET  /api/ai/history   → get user's generation history
router.get("/history",   protect, getHistory);

// GET  /api/ai/usage     → get user's monthly usage
router.get("/usage",     protect, getUsage);

module.exports = router;