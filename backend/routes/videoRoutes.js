const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateVideoPrompt,
  generateVideo,
  getVideoStatus,
  getVideoHistory,
  getVideoUsage,
} = require("../controllers/videoController");

router.post("/generate-prompt", protect, generateVideoPrompt);
router.post("/generate-video",  protect, generateVideo);
router.get("/status/:jobId",    protect, getVideoStatus);
router.get("/history",          protect, getVideoHistory);
router.get("/usage",            protect, getVideoUsage);

module.exports = router;
