const express    = require("express");
const cors       = require("cors");
const dotenv     = require("dotenv");
const rateLimit  = require("express-rate-limit");

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Rate Limiters ──────────────────────────────────────────────────────────────

// Global: 200 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
}));

// AI endpoints: 30 requests per 15 min (Gemini API costs)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "AI rate limit reached. Please wait before generating more content." },
});
app.use("/api/ai",     aiLimiter);
app.use("/api/video",  aiLimiter);
app.use("/api/design", aiLimiter);
app.use("/api/seo",    aiLimiter);
app.use("/api/email/generate-content", aiLimiter);
app.use("/api/ads/generate-copy",      aiLimiter);

// Auth-related: 10 requests per 15 min (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again later." },
});
app.use("/api/payments/create-intent", authLimiter);

// ── Routes ──
app.use("/api/users",       require("./routes/userRoutes"));
app.use("/api/ai",          require("./routes/aiRoutes"));
app.use("/api/video",       require("./routes/videoRoutes"));
app.use("/api/design",      require("./routes/designRoutes"));
app.use("/api/email",       require("./routes/emailRoutes"));
app.use("/api/seo",         require("./routes/seoRoutes"));
app.use("/api/social",      require("./routes/socialRoutes"));
app.use("/api/freelancer",  require("./routes/freelancerRoutes"));
app.use("/api/marketplace", require("./routes/marketplaceRoutes"));
app.use("/api/messages",    require("./routes/messageRoutes"));
app.use("/api/ads",         require("./routes/adCampaignRoutes"));
app.use("/api/shopify",     require("./routes/shopifyRoutes"));
app.use("/api/payments",    require("./routes/paymentRoutes"));
app.use("/api/payout",         require("./routes/payoutRoutes"));
app.use("/api/notifications",  require("./routes/notificationRoutes"));
app.use("/api/reviews",        require("./routes/reviewRoutes"));
app.use("/api/admin",          require("./routes/adminRoutes"));

// ── Health check ──
app.get("/", (req, res) => {
  res.json({ message: "DM Assistant API is running ✅" });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

module.exports = app;