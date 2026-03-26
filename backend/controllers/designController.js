const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/firebase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Monthly usage ─────────────────────────────────────────────────────────────
async function getMonthlyDesignUsage(uid) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const snap  = await db.collection("ai_designs").where("userId", "==", uid).get();
  return snap.docs.filter(doc => {
    const d = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
    return d >= start;
  }).length;
}

// ── POST /api/design/generate-image ──────────────────────────────────────────
// Step 1: Gemini crafts a detailed image prompt
// Step 2: Pollinations.ai generates the image (FREE — no API key needed)
const generateAIImage = async (req, res) => {
  const { description, style, platform, colorTheme, mood } = req.body;
  const uid = req.user.uid;

  if (!description?.trim()) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    // ── Platform sizing for Pollinations.ai ───────────────────────────────────
    const width  = platform === "story" ? 576  : platform === "facebook" || platform === "twitter" ? 1024 : 1024;
    const height = platform === "story" ? 1024 : platform === "facebook" || platform === "twitter" ? 576  : 1024;

    const platformLabel =
      platform === "story"    ? "Instagram/TikTok Story vertical 9:16" :
      platform === "facebook" ? "Facebook cover landscape 16:9"         :
      platform === "twitter"  ? "Twitter post landscape 16:9"           :
                                "Instagram square post 1:1";

    // ── Step 1: Gemini crafts the best image prompt ───────────────────────────
    const textModel   = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const geminiInput = `
You are an expert prompt engineer for AI image generation specializing in social media marketing.

Create a detailed image prompt for a social media post.

Post description: ${description}
Visual style: ${style || "modern and professional"}
Color theme: ${colorTheme || "vibrant"}
Mood: ${mood || "energetic"}
Platform: ${platformLabel}
Target market: Sri Lankan businesses

Rules:
- Write ONE detailed prompt (max 120 words)
- Include beautiful visual elements: lighting, composition, color palette, style, atmosphere
- If the description mentions an event, holiday, product or brand — include relevant bold text or typography in the image (e.g. "Happy New Year", product name, sale headline)
- Make it eye-catching and suitable for digital marketing
- End with: high quality, sharp focus, professional photography or digital art, 8k

Output ONLY the prompt. No labels, no explanation.
    `.trim();

    const geminiRes   = await textModel.generateContent(geminiInput);
    const imagePrompt = geminiRes.response.text().trim();

    // ── Step 2: Generate with Pollinations.ai (completely free) ──────────────
    const seed = Math.floor(Math.random() * 99999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

    const imgRes = await fetch(pollinationsUrl);
    if (!imgRes.ok) throw new Error(`Pollinations.ai error: ${imgRes.status}`);

    const imgBuffer  = await imgRes.arrayBuffer();
    const imageBase64 = Buffer.from(imgBuffer).toString("base64");
    const mimeType    = "image/jpeg";
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    // ── Save to Firestore ─────────────────────────────────────────────────────
    const docRef = await db.collection("ai_designs").add({
      userId:      uid,
      type:        "ai_image",
      description,
      imagePrompt,
      style:       style || "modern",
      platform:    platform || "instagram",
      colorTheme:  colorTheme || "vibrant",
      mood:        mood || "energetic",
      status:      "completed",
      createdAt:   new Date(),
    });

    // ── Notification ──────────────────────────────────────────────────────────
    await db.collection("notifications").add({
      userId:    uid,
      type:      "design",
      title:     "✅ AI Post Image Ready!",
      body:      `Your ${platform || "Instagram"} post image has been generated.`,
      read:      false,
      actionUrl: "/dashboard/post-design",
      createdAt: new Date(),
    });

    res.json({
      success:      true,
      id:           docRef.id,
      imageBase64,
      mimeType,
      imageDataUrl,
      imagePrompt,
    });

  } catch (err) {
    console.error("Image generation error:", err.message);
    res.status(500).json({ message: "Failed to generate image. Please try again.", error: err.message });
  }
};

// ── POST /api/design/save-design ─────────────────────────────────────────────
const saveDesign = async (req, res) => {
  const { templateId, templateName, headline, subtext, ctaText, brandName, size } = req.body;
  const uid = req.user.uid;
  try {
    const docRef = await db.collection("ai_designs").add({
      userId: uid, type: "template", templateId, templateName,
      headline, subtext: subtext || "", ctaText: ctaText || "",
      brandName: brandName || "", size, status: "completed", createdAt: new Date(),
    });
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to save design" });
  }
};

// ── GET /api/design/history ───────────────────────────────────────────────────
const getDesignHistory = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("ai_designs").where("userId", "==", uid).get();
    const history = snap.docs
      .map(doc => ({
        id:           doc.id,
        type:         doc.data().type,
        description:  doc.data().description || doc.data().headline || "",
        templateName: doc.data().templateName || "",
        imageUrl:     doc.data().imageUrl || null,
        platform:     doc.data().platform || "",
        style:        doc.data().style || "",
        status:       doc.data().status,
        createdAt:    doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

module.exports = { generateAIImage, saveDesign, getDesignHistory };
