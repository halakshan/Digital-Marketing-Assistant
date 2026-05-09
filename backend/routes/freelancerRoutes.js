const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  getRequests,
  respondToRequest,
  getStats,
  getPayments,
} = require("../controllers/freelancerController");

router.get("/profile",      protect, getProfile);
router.put("/profile",      protect, updateProfile);
router.get("/requests",     protect, getRequests);
router.put("/requests/:id", protect, respondToRequest);
router.get("/stats",        protect, getStats);
router.get("/payments",     protect, getPayments);

module.exports = router;
