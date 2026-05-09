const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { startConversation, getConversations } = require("../controllers/messageController");

router.post("/start",         protect, startConversation);
router.get("/conversations",  protect, getConversations);

module.exports = router;
