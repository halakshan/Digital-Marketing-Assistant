const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../config/firebase");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── POST /api/seo/analyze ─────────────────────────────────────────────────────
const analyzeURL = async (req, res) => {
  const { url, keywords } = req.body;
  const uid = req.user.uid;

  if (!url) return res.status(400).json({ message: "URL is required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
You are a senior SEO consultant. Perform a thorough, realistic SEO audit for this URL and return a detailed JSON report.

URL: ${url}
${keywords ? `Target keywords: ${keywords}` : ""}

Analyze the URL structure, domain authority, likely content, technical factors, and on-page elements.

Return ONLY a single valid JSON object with EXACTLY this structure (no markdown, no extra text):

{
  "score": <integer 0-100, weighted overall SEO score>,
  "url": "${url}",
  "title": "<realistic page title this URL likely has>",
  "metaDescription": "<realistic or recommended meta description, 150-160 chars>",

  "categoryScores": {
    "onPage":    <integer 0-100>,
    "technical": <integer 0-100>,
    "content":   <integer 0-100>,
    "backlinks": <integer 0-100>,
    "userExp":   <integer 0-100>
  },

  "metrics": {
    "pageSpeed":    <integer 0-100>,
    "mobileScore":  <integer 0-100>,
    "backlinks":    <integer, estimated count>,
    "indexedPages": <integer, estimated count>,
    "domainAge":    "<e.g. '3 years'>",
    "httpsEnabled": <boolean>,
    "hasSitemap":   <boolean>,
    "hasRobots":    <boolean>
  },

  "issues": [
    {
      "type":        "<'error'|'warning'|'info'>",
      "category":    "<'On-Page'|'Technical'|'Content'|'Backlinks'|'User Experience'>",
      "title":       "<short issue title>",
      "description": "<clear explanation of why this is a problem>",
      "fix":         "<specific actionable fix>",
      "impact":      <integer 1-15, SEO score points this fix would add>
    }
  ],

  "keywords": [
    {
      "word":        "<keyword phrase>",
      "density":     <float, percentage>,
      "volume":      "<e.g. 'High'|'Medium'|'Low'>",
      "difficulty":  "<e.g. 'Easy'|'Medium'|'Hard'>",
      "status":      "<'good'|'low'|'high'|'missing'>"
    }
  ],

  "roadTo100": [
    {
      "priority": <integer 1-N, 1=most important>,
      "action":   "<specific action to take>",
      "category": "<category name>",
      "impact":   <integer 1-15, score points this adds>,
      "effort":   "<'Easy'|'Medium'|'Hard'>",
      "done":     false
    }
  ],

  "recommendations": ["<detailed actionable recommendation>"],

  "strengths": ["<what is already good about this site's SEO>"],

  "competitors": [
    {
      "domain": "<a likely competitor domain>",
      "score":  <integer 0-100>
    }
  ]
}

Rules:
- "issues" must have 6-10 items covering different categories
- "roadTo100" must have 8-12 items sorted by priority (highest impact first), all with "done": false
- The sum of impact values in roadTo100 should roughly equal (100 - score)
- "keywords" must have 5-8 items (use provided keywords + infer from URL)
- "recommendations" must have 6-8 items
- "strengths" must have 3-5 items
- "competitors" must have 3 items
- All scores must be realistic and contextually accurate for the given URL
- Return ONLY valid JSON, absolutely no explanation or markdown
    `.trim();

    const gemRes = await model.generateContent(prompt);
    let text = gemRes.response.text().trim();
    // Strip any markdown fences
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message, "\nRaw text:", text.slice(0, 300));
      return res.status(500).json({ message: "AI returned invalid JSON. Please try again." });
    }

    // Save to Firestore
    const docRef = await db.collection("seo_analyses").add({
      userId:    uid,
      url,
      keywords:  keywords || "",
      result,
      score:     result.score || 0,
      createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id, result });
  } catch (err) {
    console.error("SEO analyze error:", err.message);
    res.status(500).json({ message: "SEO analysis failed", error: err.message });
  }
};

// ── GET /api/seo/history ──────────────────────────────────────────────────────
const getSEOHistory = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("seo_analyses")
      .where("userId", "==", uid)
      .get();

    const history = snap.docs
      .map(d => ({
        id:        d.id,
        url:       d.data().url,
        score:     d.data().score || d.data().result?.score || 0,
        keywords:  d.data().keywords || "",
        createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    res.json({ success: true, history });
  } catch (err) {
    console.error("SEO history error:", err.message);
    res.status(500).json({ message: "Failed to fetch SEO history" });
  }
};

module.exports = { analyzeURL, getSEOHistory };
