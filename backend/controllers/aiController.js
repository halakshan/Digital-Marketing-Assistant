const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/firebase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Plan limits ──
const PLAN_LIMITS = {
  free:     3,
  pro:      Infinity,
  business: Infinity,
};

// ── Get current month usage (in-memory filter avoids composite index) ──
async function getMonthlyUsage(uid) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const snap = await db.collection("ai_content")
    .where("userId", "==", uid)
    .get();

  return snap.docs.filter(doc => {
    const createdAt = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
    return createdAt >= start;
  }).length;
}

// ── POST /api/ai/generate ──
const generateContent = async (req, res) => {
  const { contentType, platform, language, tone, topic, keywords } = req.body;
  const uid = req.user.uid;

  if (!topic) return res.status(400).json({ message: "Topic is required" });

  try {
    // Get user plan
    const userSnap = await db.collection("users").doc(uid).get();
    const plan     = userSnap.exists ? (userSnap.data().plan || "free") : "free";
    const limit    = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    // Check limit
    if (limit !== Infinity) {
      const usage = await getMonthlyUsage(uid);
      if (usage >= limit) {
        return res.status(403).json({
          message:      `Monthly limit of ${limit} AI posts reached. Upgrade to Pro.`,
          limitReached: true,
          usage,
          limit,
        });
      }
    }

    // Build prompt
    const langInstruction =
      language === "Sinhala" ? "Write the content in Sinhala language (සිංහල)." :
      language === "Tamil"   ? "Write the content in Tamil language (தமிழ்)."   :
      "Write the content in English.";

    const contentTypeLabel =
      contentType === "post"     ? "social media post"  :
      contentType === "caption"  ? "image caption"      :
      contentType === "ad"       ? "advertisement copy" :
      contentType === "email"    ? "email subject line" :
      contentType === "hashtags" ? "set of hashtags"    :
      contentType === "bio"      ? "profile bio"        : contentType;

    const prompt = `
You are a professional digital marketing expert for Sri Lankan businesses.
Generate a ${contentTypeLabel} for ${platform}.
Tone: ${tone}.
Topic: ${topic}.
${keywords ? `Keywords to include: ${keywords}.` : ""}
${langInstruction}
Keep it engaging, culturally relevant for Sri Lanka, and include appropriate emojis.
Only return the generated content, no explanations or labels.
    `.trim();

    // Call Gemini
    const model    = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const gemRes   = await model.generateContent(prompt);
    const result   = gemRes.response.text();

    // Save to Firestore
    const docRef = await db.collection("ai_content").add({
      userId:    uid,
      type:      contentType,
      language,
      platform,
      tone,
      prompt:    topic,
      keywords:  keywords || "",
      output:    result,
      status:    "completed",
      createdAt: new Date(),
    });

    // Save notification
    await db.collection("notifications").add({
      userId:    uid,
      type:      "ai",
      title:     "AI Content Generated",
      body:      `Your ${contentTypeLabel} in ${language} is ready.`,
      read:      false,
      actionUrl: "/dashboard/ai-content",
      createdAt: new Date(),
    });

    const newUsage = await getMonthlyUsage(uid);

    res.json({
      success: true,
      result,
      id:      docRef.id,
      usage:   newUsage,
      limit:   limit === Infinity ? null : limit,
    });

  } catch (err) {
    console.error("AI generation error:", err.message);
    res.status(500).json({ message: "AI generation failed", error: err.message });
  }
};

// ── GET /api/ai/history ──
const getHistory = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("ai_content")
      .where("userId", "==", uid)
      .get();

    // Sort in memory to avoid composite index requirement
    const history = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

// ── GET /api/ai/usage ──
const getUsage = async (req, res) => {
  const uid = req.user.uid;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const plan     = userSnap.exists ? (userSnap.data().plan || "free") : "free";
    const limit    = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const usage    = await getMonthlyUsage(uid);
    res.json({
      success:   true,
      usage,
      limit:     limit === Infinity ? null : limit,
      plan,
      remaining: limit === Infinity ? null : Math.max(0, limit - usage),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch usage" });
  }
};

module.exports = { generateContent, getHistory, getUsage };
