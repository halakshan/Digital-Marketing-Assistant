const express = require("express");
const router  = express.Router();
const { protect }                   = require("../middleware/authMiddleware");
const { submitReview, getMyReviews } = require("../controllers/reviewController");

router.post("/",           protect, submitReview);
router.get("/my-reviews",  protect, getMyReviews);

module.exports = router;
