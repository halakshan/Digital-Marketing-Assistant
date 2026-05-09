const { db } = require("../config/firebase");
const axios  = require("axios");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL  = process.env.BACKEND_URL  || "http://localhost:5001";

// ── Callback redirect URLs ────────────────────────────────────────────────────
const REDIRECT = {
  facebook:  `${BACKEND_URL}/api/social/callback/facebook`,
  instagram: `${BACKEND_URL}/api/social/callback/instagram`,
  linkedin:  `${BACKEND_URL}/api/social/callback/linkedin`,
  youtube:   `${BACKEND_URL}/api/social/callback/youtube`,
  tiktok:    `${BACKEND_URL}/api/social/callback/tiktok`,
};

// ── Helper: save / update account in Firestore ────────────────────────────────
async function saveAccount({ uid, platform, accountName, accountId, avatar, followers, accessToken, refreshToken }) {
  const existing = await db.collection("social_accounts")
    .where("userId", "==", uid)
    .where("platform", "==", platform)
    .get();

  const data = {
    userId: uid, platform, accountName,
    accountId:    accountId    || "",
    avatar:       avatar       || null,
    followers:    followers    || 0,
    accessToken:  accessToken  || "",
    refreshToken: refreshToken || "",
    status:       "connected",
    updatedAt:    new Date(),
  };

  if (!existing.empty) {
    await db.collection("social_accounts").doc(existing.docs[0].id).update(data);
    return existing.docs[0].id;
  }

  data.connectedAt = new Date();
  const ref = await db.collection("social_accounts").add(data);

  await db.collection("notifications").add({
    userId: uid, type: "social",
    title: `${platform} Connected`,
    body:  `Your ${platform} account "${accountName}" is now connected.`,
    read: false, actionUrl: "/dashboard/social-accounts", createdAt: new Date(),
  });

  return ref.id;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/social/accounts
// ═══════════════════════════════════════════════════════════════════════════════
const getAccounts = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("social_accounts").where("userId", "==", uid).get();
    const accounts = snap.docs.map(doc => ({
      id:          doc.id,
      platform:    doc.data().platform,
      accountName: doc.data().accountName,
      accountId:   doc.data().accountId,
      avatar:      doc.data().avatar || null,
      followers:   doc.data().followers || 0,
      status:      doc.data().status,
      connectedAt: doc.data().connectedAt?.toDate?.() || doc.data().connectedAt,
    }));
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/social/oauth/:platform?uid=xxx
//  Returns the OAuth authorization URL for the given platform
// ═══════════════════════════════════════════════════════════════════════════════
const getOAuthUrl = (req, res) => {
  const { platform } = req.params;
  const uid          = req.user.uid;
  const state        = Buffer.from(JSON.stringify({ uid, platform })).toString("base64");

  let url = "";

  if (platform === "facebook" || platform === "instagram") {
    if (!process.env.FACEBOOK_APP_ID) {
      return res.status(503).json({ message: "Facebook App ID not configured. Add FACEBOOK_APP_ID to .env" });
    }
    const scope = platform === "instagram"
      ? "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"
      : "pages_show_list,pages_manage_posts,pages_read_engagement,public_profile,email";
    url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT.facebook)}&scope=${scope}&state=${encodeURIComponent(state)}&response_type=code`;

  } else if (platform === "linkedin") {
    if (!process.env.LINKEDIN_CLIENT_ID) {
      return res.status(503).json({ message: "LinkedIn Client ID not configured. Add LINKEDIN_CLIENT_ID to .env" });
    }
    url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT.linkedin)}&scope=openid%20profile%20email%20w_member_social&state=${encodeURIComponent(state)}`;

  } else if (platform === "youtube") {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google Client ID not configured. Add GOOGLE_CLIENT_ID to .env" });
    }
    url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT.youtube)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly%20https://www.googleapis.com/auth/userinfo.profile%20https://www.googleapis.com/auth/userinfo.email&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;

  } else if (platform === "tiktok") {
    if (!process.env.TIKTOK_CLIENT_KEY) {
      return res.status(503).json({ message: "TikTok Client Key not configured. Add TIKTOK_CLIENT_KEY to .env" });
    }
    url = `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(REDIRECT.tiktok)}&response_type=code&scope=user.info.basic&state=${encodeURIComponent(state)}`;

  } else {
    return res.status(400).json({ message: "Unknown platform" });
  }

  res.json({ success: true, url });
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FACEBOOK / INSTAGRAM CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
const facebookCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=access_denied`);

  try {
    const { uid, platform } = JSON.parse(Buffer.from(state, "base64").toString());

    // Exchange code for token
    const tokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        client_id:     process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri:  REDIRECT.facebook,
        code,
      },
    });
    const accessToken = tokenRes.data.access_token;

    // Get user profile
    const profileRes = await axios.get("https://graph.facebook.com/me", {
      params: { fields: "id,name,email,picture", access_token: accessToken },
    });
    const profile = profileRes.data;

    let accountName = profile.name || "Facebook User";
    let accountId   = profile.id   || "";
    let avatar      = profile.picture?.data?.url || null;
    let followers   = 0;

    // Try to get page followers if Instagram
    if (platform === "instagram") {
      try {
        const pagesRes = await axios.get("https://graph.facebook.com/me/accounts", {
          params: { access_token: accessToken },
        });
        if (pagesRes.data.data?.[0]) {
          const page     = pagesRes.data.data[0];
          const igRes    = await axios.get(`https://graph.facebook.com/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
          const igId     = igRes.data?.instagram_business_account?.id;
          if (igId) {
            const igProfile = await axios.get(`https://graph.facebook.com/${igId}?fields=username,followers_count,profile_picture_url&access_token=${page.access_token}`);
            accountName = "@" + (igProfile.data.username || accountName);
            followers   = igProfile.data.followers_count || 0;
            avatar      = igProfile.data.profile_picture_url || avatar;
          }
        }
      } catch { /* fall back to FB profile */ }
    }

    await saveAccount({ uid, platform: platform === "instagram" ? "Instagram" : "Facebook", accountName, accountId, avatar, followers, accessToken });

    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?connected=${platform}`);
  } catch (err) {
    console.error("Facebook callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=facebook_failed`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  LINKEDIN CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
const linkedinCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=access_denied`);

  try {
    const { uid } = JSON.parse(Buffer.from(state, "base64").toString());

    // Exchange code for token
    const tokenRes = await axios.post("https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  REDIRECT.linkedin,
        client_id:     process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const accessToken = tokenRes.data.access_token;

    // Get profile using OpenID Connect userinfo endpoint
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = profileRes.data;

    const accountName = `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || "LinkedIn User";
    const avatar      = profile.picture || null;

    await saveAccount({ uid, platform: "LinkedIn", accountName, accountId: profile.sub || "", avatar, followers: 0, accessToken });

    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?connected=linkedin`);
  } catch (err) {
    console.error("LinkedIn callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=linkedin_failed`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  YOUTUBE (Google) CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
const youtubeCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=access_denied`);

  try {
    const { uid } = JSON.parse(Buffer.from(state, "base64").toString());

    // Exchange code for token
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT.youtube,
        grant_type:    "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const { access_token, refresh_token } = tokenRes.data;

    // Get YouTube channel info
    const channelRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: { part: "snippet,statistics", mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const channel = channelRes.data.items?.[0];

    const accountName = channel?.snippet?.title         || "YouTube Channel";
    const avatar      = channel?.snippet?.thumbnails?.default?.url || null;
    const followers   = parseInt(channel?.statistics?.subscriberCount || "0");
    const accountId   = channel?.id || "";

    await saveAccount({ uid, platform: "YouTube", accountName, accountId, avatar, followers, accessToken: access_token, refreshToken: refresh_token });

    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?connected=youtube`);
  } catch (err) {
    console.error("YouTube callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=youtube_failed`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TIKTOK CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
const tiktokCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=access_denied`);

  try {
    const { uid } = JSON.parse(Buffer.from(state, "base64").toString());

    // Exchange code for token
    const tokenRes = await axios.post("https://open.tiktokapis.com/v2/oauth/token/",
      new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  REDIRECT.tiktok,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const accessToken = tokenRes.data.access_token;

    // Get user info
    const profileRes = await axios.get("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = profileRes.data.data?.user;

    const accountName = user?.display_name  || "TikTok User";
    const avatar      = user?.avatar_url    || null;
    const followers   = user?.follower_count || 0;

    await saveAccount({ uid, platform: "TikTok", accountName, accountId: user?.open_id || "", avatar, followers, accessToken });

    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?connected=tiktok`);
  } catch (err) {
    console.error("TikTok callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/dashboard/social-accounts?error=tiktok_failed`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/social/connect  (manual connect — keep for fallback)
// ═══════════════════════════════════════════════════════════════════════════════
const connectAccount = async (req, res) => {
  const { platform, accountName, accountId, accessToken, avatar, followers } = req.body;
  const uid = req.user.uid;
  if (!platform || !accountName) {
    return res.status(400).json({ message: "Platform and account name are required" });
  }
  try {
    await saveAccount({ uid, platform, accountName, accountId, avatar, followers, accessToken });
    res.json({ success: true, message: `${platform} connected successfully` });
  } catch (err) {
    res.status(500).json({ message: "Failed to connect account" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/social/demo-connect
//  Connects a demo/test account (no real OAuth needed)
// ═══════════════════════════════════════════════════════════════════════════════
const demoConnect = async (req, res) => {
  const uid            = req.user.uid;
  const { platform }   = req.body;

  const DEMO_ACCOUNTS = {
    Facebook:  { accountName: "My Business Page",    accountId: "demo_fb_001",  avatar: null, followers: 4280  },
    Instagram: { accountName: "@mybusiness",          accountId: "demo_ig_001",  avatar: null, followers: 8750  },
    LinkedIn:  { accountName: "Demo User",            accountId: "demo_li_001",  avatar: null, followers: 1230  },
    YouTube:   { accountName: "My YouTube Channel",   accountId: "demo_yt_001",  avatar: null, followers: 15400 },
    TikTok:    { accountName: "@myaccount",           accountId: "demo_tt_001",  avatar: null, followers: 23100 },
  };

  const demo = DEMO_ACCOUNTS[platform];
  if (!demo) return res.status(400).json({ message: "Unknown platform" });

  try {
    await saveAccount({
      uid, platform,
      accountName:  demo.accountName,
      accountId:    demo.accountId,
      avatar:       demo.avatar,
      followers:    demo.followers,
      accessToken:  "demo_access_token",
      refreshToken: "",
    });
    res.json({ success: true, message: `${platform} demo account connected` });
  } catch (err) {
    res.status(500).json({ message: "Failed to connect demo account" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/social/save-credentials
//  Saves OAuth credentials to process.env (runtime only — persists via .env update)
// ═══════════════════════════════════════════════════════════════════════════════
const fs   = require("fs");
const path = require("path");

const saveCredentials = async (req, res) => {
  const {
    FACEBOOK_APP_ID, FACEBOOK_APP_SECRET,
    LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET,
  } = req.body;

  try {
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    const set = (key, val) => {
      if (!val) return;
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
      process.env[key] = val;
    };

    set("FACEBOOK_APP_ID",      FACEBOOK_APP_ID);
    set("FACEBOOK_APP_SECRET",  FACEBOOK_APP_SECRET);
    set("LINKEDIN_CLIENT_ID",   LINKEDIN_CLIENT_ID);
    set("LINKEDIN_CLIENT_SECRET", LINKEDIN_CLIENT_SECRET);
    set("GOOGLE_CLIENT_ID",     GOOGLE_CLIENT_ID);
    set("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET);
    set("TIKTOK_CLIENT_KEY",    TIKTOK_CLIENT_KEY);
    set("TIKTOK_CLIENT_SECRET", TIKTOK_CLIENT_SECRET);

    fs.writeFileSync(envPath, envContent, "utf8");

    res.json({ success: true, message: "Credentials saved. OAuth connections are now active." });
  } catch (err) {
    console.error("Save credentials error:", err.message);
    res.status(500).json({ message: "Failed to save credentials" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/social/credentials-status
//  Returns which platforms have credentials configured
// ═══════════════════════════════════════════════════════════════════════════════
const getCredentialsStatus = (req, res) => {
  res.json({
    success: true,
    status: {
      facebook:  !!(process.env.FACEBOOK_APP_ID  && process.env.FACEBOOK_APP_SECRET),
      instagram: !!(process.env.FACEBOOK_APP_ID  && process.env.FACEBOOK_APP_SECRET),
      linkedin:  !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      youtube:   !!(process.env.GOOGLE_CLIENT_ID  && process.env.GOOGLE_CLIENT_SECRET),
      tiktok:    !!(process.env.TIKTOK_CLIENT_KEY  && process.env.TIKTOK_CLIENT_SECRET),
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DELETE /api/social/disconnect/:id
// ═══════════════════════════════════════════════════════════════════════════════
const disconnectAccount = async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;
  try {
    const doc = await db.collection("social_accounts").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(403).json({ message: "Not found" });
    }
    await db.collection("social_accounts").doc(id).delete();
    res.json({ success: true, message: "Account disconnected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to disconnect" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/social/publish
//  Body: { platforms: ["Facebook","LinkedIn",...], message, imageUrl? }
// ═══════════════════════════════════════════════════════════════════════════════
const publishPost = async (req, res) => {
  const uid = req.user.uid;
  const { platforms, message, imageUrl } = req.body;

  if (!platforms?.length || !message?.trim()) {
    return res.status(400).json({ message: "platforms and message are required" });
  }

  // Load all connected accounts for this user
  const snap = await db.collection("social_accounts").where("userId", "==", uid).get();
  const accountMap = {};
  snap.docs.forEach(doc => { accountMap[doc.data().platform] = doc.data(); });

  const results = [];

  for (const platform of platforms) {
    const acc = accountMap[platform];
    if (!acc) { results.push({ platform, success: false, error: "Not connected" }); continue; }

    try {
      // ── Demo account — simulate success ──
      if (acc.accessToken === "demo_access_token") {
        results.push({ platform, success: true, demo: true });
        continue;
      }

      // ── Facebook ──
      if (platform === "Facebook") {
        // First get the user's pages
        const pagesRes = await axios.get("https://graph.facebook.com/me/accounts", {
          params: { access_token: acc.accessToken },
        });
        const page = pagesRes.data.data?.[0];
        if (!page) throw new Error("No Facebook Page found. Connect a Page to post.");

        const postData = { message, access_token: page.access_token };
        if (imageUrl) {
          await axios.post(`https://graph.facebook.com/${page.id}/photos`, {
            url: imageUrl, caption: message, access_token: page.access_token,
          });
        } else {
          await axios.post(`https://graph.facebook.com/${page.id}/feed`, postData);
        }
        results.push({ platform, success: true });
      }

      // ── Instagram ──
      else if (platform === "Instagram") {
        if (!imageUrl) throw new Error("Instagram requires an image URL to post.");
        const pagesRes = await axios.get("https://graph.facebook.com/me/accounts", {
          params: { access_token: acc.accessToken },
        });
        const page = pagesRes.data.data?.[0];
        if (!page) throw new Error("No Facebook Page linked to Instagram.");
        const igRes = await axios.get(`https://graph.facebook.com/${page.id}`, {
          params: { fields: "instagram_business_account", access_token: page.access_token },
        });
        const igId = igRes.data?.instagram_business_account?.id;
        if (!igId) throw new Error("No Instagram Business account linked.");

        // Step 1: Create media container
        const containerRes = await axios.post(`https://graph.facebook.com/${igId}/media`, null, {
          params: { image_url: imageUrl, caption: message, access_token: page.access_token },
        });
        // Step 2: Publish
        await axios.post(`https://graph.facebook.com/${igId}/media_publish`, null, {
          params: { creation_id: containerRes.data.id, access_token: page.access_token },
        });
        results.push({ platform, success: true });
      }

      // ── LinkedIn ──
      else if (platform === "LinkedIn") {
        // Get the LinkedIn person URN
        const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${acc.accessToken}` },
        });
        const personUrn = `urn:li:person:${profileRes.data.sub}`;

        const postBody = {
          author:     personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary:  { text: message },
              shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
              ...(imageUrl && {
                media: [{
                  status: "READY",
                  description: { text: message.slice(0, 200) },
                  originalUrl: imageUrl,
                  title: { text: "Post" },
                }],
              }),
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        };

        await axios.post("https://api.linkedin.com/v2/ugcPosts", postBody, {
          headers: {
            Authorization: `Bearer ${acc.accessToken}`,
            "Content-Type":  "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        });
        results.push({ platform, success: true });
      }

      // ── YouTube / TikTok ──
      else if (platform === "YouTube" || platform === "TikTok") {
        results.push({ platform, success: false, error: `${platform} only supports video uploads, not text posts.` });
      }

      else {
        results.push({ platform, success: false, error: "Platform not supported for posting." });
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Unknown error";
      results.push({ platform, success: false, error: msg });
    }
  }

  // Save post history to Firestore
  await db.collection("social_posts").add({
    userId: uid,
    platforms,
    message,
    imageUrl: imageUrl || null,
    results,
    createdAt: new Date(),
  });

  const allOk    = results.every(r => r.success);
  const anyOk    = results.some(r => r.success);
  const httpCode = allOk ? 200 : anyOk ? 207 : 400;

  res.status(httpCode).json({ success: anyOk, results });
};

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/social/posts  — post history
// ═══════════════════════════════════════════════════════════════════════════════
const getPosts = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("social_posts").where("userId", "==", uid).get();
    const posts = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

module.exports = {
  getAccounts, getOAuthUrl, connectAccount, disconnectAccount,
  facebookCallback, linkedinCallback, youtubeCallback, tiktokCallback,
  publishPost, getPosts,
  demoConnect, saveCredentials, getCredentialsStatus,
};
