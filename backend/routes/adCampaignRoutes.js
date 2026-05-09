const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCampaign, getCampaigns, updateCampaignStatus, deleteCampaign, generateAdCopy,
} = require("../controllers/adCampaignController");

router.post("/create",          protect, createCampaign);
router.get("/campaigns",        protect, getCampaigns);
router.patch("/:id/status",     protect, updateCampaignStatus);
router.delete("/:id",           protect, deleteCampaign);
router.post("/generate-copy",   protect, generateAdCopy);

module.exports = router;
