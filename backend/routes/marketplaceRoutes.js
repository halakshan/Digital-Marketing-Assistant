const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getFreelancers, sendHireRequest, getMyHires } = require("../controllers/marketplaceController");

router.get("/freelancers", protect, getFreelancers);
router.post("/hire",       protect, sendHireRequest);
router.get("/my-hires",    protect, getMyHires);

module.exports = router;
