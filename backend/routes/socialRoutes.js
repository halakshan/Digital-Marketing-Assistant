const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAccounts, getOAuthUrl, connectAccount, disconnectAccount,
  facebookCallback, linkedinCallback, youtubeCallback, tiktokCallback,
  publishPost, getPosts,
  demoConnect, saveCredentials, getCredentialsStatus,
} = require("../controllers/socialController");

// ── Protected routes (need Firebase token) ───────────────────────────────────
router.get("/accounts",              protect, getAccounts);
router.get("/oauth/:platform",       protect, getOAuthUrl);
router.post("/connect",              protect, connectAccount);
router.delete("/disconnect/:id",     protect, disconnectAccount);
router.post("/publish",              protect, publishPost);
router.get("/posts",                 protect, getPosts);
router.post("/demo-connect",         protect, demoConnect);
router.post("/save-credentials",     protect, saveCredentials);
router.get("/credentials-status",    protect, getCredentialsStatus);

// ── OAuth callbacks (called by social platforms — no token needed) ────────────
router.get("/callback/facebook",  facebookCallback);
router.get("/callback/instagram", facebookCallback);   // same handler
router.get("/callback/linkedin",  linkedinCallback);
router.get("/callback/youtube",   youtubeCallback);
router.get("/callback/tiktok",    tiktokCallback);

module.exports = router;
