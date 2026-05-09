const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCampaign,
  getCampaigns,
  deleteCampaign,
  sendCampaign,
  getCampaignDetails,
  generateEmailContent,
  getSubscribers,
  addSubscriber,
  bulkImportSubscribers,
  deleteSubscriber,
} = require("../controllers/emailController");

// ── Campaigns ──────────────────────────────────────────────────────────────────
router.post("/create",           protect, createCampaign);
router.get("/campaigns",         protect, getCampaigns);
router.delete("/:id",            protect, deleteCampaign);
router.post("/:id/send",         protect, sendCampaign);
router.get("/:id/details",       protect, getCampaignDetails);

// ── AI ─────────────────────────────────────────────────────────────────────────
router.post("/generate-content", protect, generateEmailContent);

// ── Subscribers ────────────────────────────────────────────────────────────────
router.get("/subscribers",           protect, getSubscribers);
router.post("/subscribers/add",      protect, addSubscriber);
router.post("/subscribers/bulk",     protect, bulkImportSubscribers);
router.delete("/subscribers/:id",    protect, deleteSubscriber);

module.exports = router;
