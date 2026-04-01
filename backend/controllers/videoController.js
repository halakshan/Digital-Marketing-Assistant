const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/firebase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VIDEO_LIMITS = { free: 2, pro: Infinity, business: Infinity };

async function getMonthlyVideoUsage(uid) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const snap  = await db.collection("video_ads").where("userId", "==", uid).get();
  return snap.docs.filter(doc => {
    const d = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
    return d >= start;
  }).length;
}

// ── Generate image for a scene via Pollinations.ai ───────────────────────────
async function generateSceneImage(visualDesc, width, height, seed) {
  const prompt = `${visualDesc}, professional marketing photo, high quality, sharp focus, cinematic lighting, 8k`;
  const url    = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
  try {
    const res    = await fetch(url);
    if (!res.ok) return null;
    const buf    = await res.arrayBuffer();
    const b64    = Buffer.from(buf).toString("base64");
    return `data:image/jpeg;base64,${b64}`;
  } catch { return null; }
}

// ── POST /api/video/generate-prompt ──────────────────────────────────────────
const generateVideoPrompt = async (req, res) => {
  const { adStyle, platform, language, duration, mood, product, audience, keyMessage } = req.body;
  const uid = req.user.uid;

  if (!product?.trim() || !audience?.trim()) {
    return res.status(400).json({ message: "Product and Target Audience are required" });
  }

  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const plan     = userSnap.exists ? (userSnap.data().plan || "free") : "free";
    const limit    = VIDEO_LIMITS[plan] ?? VIDEO_LIMITS.free;

    if (limit !== Infinity) {
      const usage = await getMonthlyVideoUsage(uid);
      if (usage >= limit) {
        return res.status(403).json({
          message: `Monthly limit of ${limit} video ads reached. Upgrade to Pro.`,
          limitReached: true, usage, limit,
        });
      }
    }

    const langNote =
      language === "Sinhala" ? "Write voiceover in Sinhala (සිංහල)." :
      language === "Tamil"   ? "Write voiceover in Tamil (தமிழ்)."    :
      "Write voiceover in English.";

    const platformLabel =
      platform === "instagram_reels" ? "Instagram Reels 9:16 vertical" :
      platform === "facebook"        ? "Facebook Feed 1:1 square"       :
      platform === "youtube"         ? "YouTube Pre-roll 16:9 landscape" :
      platform === "tiktok"          ? "TikTok 9:16 vertical"           : platform;

    const prompt = `
You are a professional video ad director for Sri Lankan markets.

Create a ${duration} ${adStyle} video ad script for:
Product/Service: ${product}
Target Audience: ${audience}
${keyMessage ? `Key Message: ${keyMessage}` : ""}
Platform: ${platformLabel}
Style: ${adStyle} | Mood: ${mood}
${langNote}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Short catchy ad title",
  "hook": "Opening hook line",
  "scenes": [
    {
      "id": 1,
      "timeCode": "0:00-0:05",
      "visual": "Detailed scene visual for image generation (describe setting, lighting, people, colors, composition)",
      "textOverlay": "On-screen text (short)",
      "voiceover": "Voiceover line in ${language}",
      "transition": "Transition type to next scene"
    }
  ],
  "callToAction": "Final CTA text",
  "hashtags": ["tag1", "tag2", "tag3"]
}

Use 4-6 scenes. Each scene visual must be detailed enough for AI image generation.
    `.trim();

    const model  = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Parse JSON from response
    let scriptData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      scriptData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      // Fallback: create basic structure from raw text
      scriptData = {
        title: product,
        hook: `Discover ${product}`,
        scenes: [
          { id: 1, timeCode: "0:00-0:10", visual: `Professional advertisement for ${product}, modern setting, vibrant colors`, textOverlay: product, voiceover: keyMessage || `Introducing ${product}`, transition: "fade" },
          { id: 2, timeCode: "0:10-0:20", visual: `Happy ${audience} using ${product}, lifestyle photography, bright natural lighting`, textOverlay: "Experience the difference", voiceover: `Perfect for ${audience}`, transition: "slide" },
          { id: 3, timeCode: "0:20-0:30", visual: `${product} close-up product shot, clean background, premium photography`, textOverlay: keyMessage || "Get yours today", voiceover: "Order now!", transition: "zoom" },
        ],
        callToAction: "Shop Now!",
        hashtags: [product.replace(/\s+/g, ""), "SriLanka", "ShopNow"],
      };
    }

    // Build readable script text
    const script = [
      `🎬 ${scriptData.title || product}`,
      `Hook: ${scriptData.hook || ""}`,
      "",
      ...(scriptData.scenes || []).map(s =>
        `[SCENE ${s.id} — ${s.timeCode}]\nVisual: ${s.visual}\nText: ${s.textOverlay || ""}\nVoiceover: ${s.voiceover || ""}\nTransition: ${s.transition || "cut"}`
      ),
      "",
      `CTA: ${scriptData.callToAction || ""}`,
      `Hashtags: ${(scriptData.hashtags || []).map(h => `#${h}`).join(" ")}`,
    ].join("\n");

    const docRef = await db.collection("video_ads").add({
      userId: uid, adStyle, platform, language, duration, mood,
      product, audience, keyMessage: keyMessage || "",
      script, scriptData: JSON.stringify(scriptData),
      status: "prompt_ready", videoUrl: null, createdAt: new Date(),
    });

    await db.collection("notifications").add({
      userId: uid, type: "video", title: "🎬 Video Script Ready",
      body: `Your ${duration} ${adStyle} video ad script for "${product}" is ready.`,
      read: false, actionUrl: "/dashboard/video-ads", createdAt: new Date(),
    });

    const newUsage = await getMonthlyVideoUsage(uid);
    res.json({ success: true, jobId: docRef.id, script, scriptData, usage: newUsage, limit: limit === Infinity ? null : limit });

  } catch (err) {
    console.error("Video prompt error:", err.message);
    res.status(500).json({ message: "Failed to generate video script. Please try again.", error: err.message });
  }
};

// ── POST /api/video/generate-video ───────────────────────────────────────────
// Generates a scene image for every scene in the script using Pollinations.ai
const generateVideo = async (req, res) => {
  const { jobId } = req.body;
  const uid = req.user.uid;

  if (!jobId) return res.status(400).json({ message: "jobId is required" });

  try {
    const jobSnap = await db.collection("video_ads").doc(jobId).get();
    if (!jobSnap.exists || jobSnap.data().userId !== uid) {
      return res.status(403).json({ message: "Job not found" });
    }

    const job = jobSnap.data();
    await db.collection("video_ads").doc(jobId).update({ status: "generating" });

    // Parse scenes
    let scriptData;
    try { scriptData = JSON.parse(job.scriptData || "{}"); } catch { scriptData = {}; }
    const scenes = scriptData.scenes || [];

    // Determine canvas dimensions based on platform
    const isVertical  = job.platform === "instagram_reels" || job.platform === "tiktok";
    const isLandscape = job.platform === "youtube";
    const width  = isLandscape ? 1280 : isVertical ? 720  : 1080;
    const height = isLandscape ? 720  : isVertical ? 1280 : 1080;

    // Generate one image per scene (in parallel, max 4 at once)
    const sceneImages = [];
    const chunkSize = 3; // parallel batch size
    for (let i = 0; i < scenes.length; i += chunkSize) {
      const batch = scenes.slice(i, i + chunkSize);
      const imgs  = await Promise.all(
        batch.map((scene, idx) => generateSceneImage(scene.visual, width, height, (i + idx) * 7 + 42))
      );
      sceneImages.push(...imgs);
    }

    // Build scenes with images
    const scenesWithImages = scenes.map((scene, idx) => ({
      ...scene,
      imageData: sceneImages[idx] || null,
    }));

    await db.collection("video_ads").doc(jobId).update({
      status: "completed",
      scenesWithImages: JSON.stringify(scenesWithImages),
    });

    await db.collection("notifications").add({
      userId: uid, type: "video", title: "🎬 Video Scenes Ready!",
      body: `${scenesWithImages.filter(s => s.imageData).length} scene images generated for "${job.product}". Download your video!`,
      read: false, actionUrl: "/dashboard/video-ads", createdAt: new Date(),
    });

    res.json({
      success: true,
      jobId,
      status: "completed",
      scenesWithImages,
      canvasWidth:  width,
      canvasHeight: height,
      message: `${scenesWithImages.filter(s => s.imageData).length} scene images generated. Create and download your video!`,
    });

  } catch (err) {
    console.error("Generate video error:", err.message);
    await db.collection("video_ads").doc(jobId).update({ status: "failed" }).catch(() => {});
    res.status(500).json({ message: "Failed to generate video scenes", error: err.message });
  }
};

// ── GET /api/video/status/:jobId ─────────────────────────────────────────────
const getVideoStatus = async (req, res) => {
  const { jobId } = req.params;
  const uid = req.user.uid;
  try {
    const jobSnap = await db.collection("video_ads").doc(jobId).get();
    if (!jobSnap.exists || jobSnap.data().userId !== uid) {
      return res.status(404).json({ message: "Job not found" });
    }
    const job = { id: jobSnap.id, ...jobSnap.data() };
    res.json({
      success: true,
      job: {
        id: job.id, status: job.status, videoUrl: job.videoUrl || null,
        script: job.script, product: job.product, platform: job.platform,
        duration: job.duration, language: job.language, adStyle: job.adStyle,
        createdAt: job.createdAt?.toDate?.() || job.createdAt,
        scenesWithImages: job.scenesWithImages || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get video status" });
  }
};

// ── GET /api/video/history ───────────────────────────────────────────────────
const getVideoHistory = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("video_ads").where("userId", "==", uid).get();
    const history = snap.docs
      .map(doc => ({
        id: doc.id, product: doc.data().product, platform: doc.data().platform,
        language: doc.data().language, duration: doc.data().duration,
        adStyle: doc.data().adStyle, status: doc.data().status,
        videoUrl: doc.data().videoUrl || null, script: doc.data().script,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch video history" });
  }
};

// ── GET /api/video/usage ─────────────────────────────────────────────────────
const getVideoUsage = async (req, res) => {
  const uid = req.user.uid;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const plan     = userSnap.exists ? (userSnap.data().plan || "free") : "free";
    const limit    = VIDEO_LIMITS[plan] ?? VIDEO_LIMITS.free;
    const usage    = await getMonthlyVideoUsage(uid);
    res.json({
      success: true, usage, plan,
      limit:     limit === Infinity ? null : limit,
      remaining: limit === Infinity ? null : Math.max(0, limit - usage),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch video usage" });
  }
};

module.exports = { generateVideoPrompt, generateVideo, getVideoStatus, getVideoHistory, getVideoUsage };
