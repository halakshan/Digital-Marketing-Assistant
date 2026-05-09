const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { analyzeURL, getSEOHistory } = require("../controllers/seoController");

router.post("/analyze",  protect, analyzeURL);
router.get("/history",   protect, getSEOHistory);

module.exports = router;
