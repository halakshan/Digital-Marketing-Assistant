const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/firebase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── POST /api/ads/create ──────────────────────────────────────────────────────
const createCampaign = async (req, res) => {
  const {
    name, platform, objective, budget, budgetType, startDate, endDate,
    adFormat, targeting, adText, headline, description, imageUrl, callToAction,
  } = req.body;
  const uid = req.user.uid;

  if (!name || !platform || !objective || !budget) {
    return res.status(400).json({ message: "Name, platform, objective and budget are required" });
  }

  try {
    const docRef = await db.collection("ad_campaigns").add({
      userId: uid, name, platform, objective,
      budget: parseFloat(budget), budgetType: budgetType || "daily",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || "",
      adFormat: adFormat || "single_image",
      targeting: targeting || {},
      adText: adText || "", headline: headline || "",
      description: description || "", imageUrl: imageUrl || "",
      callToAction: callToAction || "Learn More",
      status: "draft",
      spend: 0, impressions: 0, clicks: 0, conversions: 0,
      createdAt: new Date(),
    });

    await db.collection("notifications").add({
      userId: uid, type: "campaign",
      title: "Ad Campaign Created",
      body: `Campaign "${name}" on ${platform} has been created as a draft.`,
      read: false, actionUrl: "/dashboard/ad-campaigns", createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id, message: "Campaign created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create campaign" });
  }
};

// ── GET /api/ads/campaigns ────────────────────────────────────────────────────
const getCampaigns = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("ad_campaigns").where("userId", "==", uid).get();
    const campaigns = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// ── PATCH /api/ads/:id/status ─────────────────────────────────────────────────
const updateCampaignStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const uid = req.user.uid;
  const validStatuses = ["draft", "active", "paused", "completed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const doc = await db.collection("ad_campaigns").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) return res.status(403).json({ message: "Not found" });
    await db.collection("ad_campaigns").doc(id).update({ status, updatedAt: new Date() });
    res.json({ success: true, message: `Campaign ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ── DELETE /api/ads/:id ───────────────────────────────────────────────────────
const deleteCampaign = async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;
  try {
    const doc = await db.collection("ad_campaigns").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) return res.status(403).json({ message: "Not found" });
    await db.collection("ad_campaigns").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

// ── POST /api/ads/generate-copy ───────────────────────────────────────────────
const generateAdCopy = async (req, res) => {
  const { product, audience, platform, objective, tone } = req.body;
  const uid = req.user.uid;
  if (!product) return res.status(400).json({ message: "Product is required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `
You are an expert digital marketing copywriter for Sri Lankan businesses.
Write ad copy for a ${platform || "Facebook"} ad campaign.

Product/Service: ${product}
Target audience: ${audience || "general Sri Lankan audience"}
Campaign objective: ${objective || "awareness"}
Tone: ${tone || "professional"}

Return a JSON object with exactly these fields:
{
  "headline": "catchy headline under 40 chars",
  "primaryText": "engaging ad text under 125 chars",
  "description": "brief description under 30 chars",
  "callToAction": "one of: Learn More, Shop Now, Sign Up, Book Now, Contact Us, Get Quote"
}
Return ONLY valid JSON, no explanation.
    `.trim();

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const copy = JSON.parse(text);
    res.json({ success: true, copy });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate ad copy" });
  }
};

module.exports = { createCampaign, getCampaigns, updateCampaignStatus, deleteCampaign, generateAdCopy };
