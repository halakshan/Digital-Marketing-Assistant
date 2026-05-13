const express = require("express");
const router  = express.Router();
const { protect }                   = require("../middleware/authMiddleware");
const { submitReview, getMyReviews, getFreelancerReviews } = require("../controllers/reviewController");

router.post("/",                    protect, submitReview);
router.get("/my-reviews",           protect, getMyReviews);
router.get("/freelancer/:uid",      protect, getFreelancerReviews);

module.exports = router;
