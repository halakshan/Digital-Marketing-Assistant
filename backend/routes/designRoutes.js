const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateAIImage, saveDesign, getDesignHistory } = require("../controllers/designController");

router.post("/generate-image", protect, generateAIImage);
router.post("/save-design",    protect, saveDesign);
router.get("/history",         protect, getDesignHistory);

module.exports = router;
