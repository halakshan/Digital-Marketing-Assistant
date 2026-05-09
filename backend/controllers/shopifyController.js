const axios  = require("axios");
const crypto = require("crypto");
const { db } = require("../config/firebase");

const API_KEY    = process.env.SHOPIFY_API_KEY    || "";
const API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SCOPES     = process.env.SHOPIFY_SCOPES     || "read_themes,write_themes,read_products,write_products,read_content,write_content";
const FRONTEND   = process.env.FRONTEND_URL       || "http://localhost:3000";
const BACKEND    = process.env.BACKEND_URL        || "http://localhost:5001";
const REDIRECT   = `${BACKEND}/api/shopify/callback`;

// ── Shopify API helper ────────────────────────────────────────────────────────
const shopify = (shop, token) =>
  axios.create({
    baseURL: `https://${shop}/admin/api/2024-01`,
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });

// ── GET /api/shopify/install?shop=xxx.myshopify.com ──────────────────────────
const install = (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).json({ message: "shop param required" });

  const state    = crypto.randomBytes(16).toString("hex");
  const authUrl  = `https://${shop}/admin/oauth/authorize`
    + `?client_id=${API_KEY}`
    + `&scope=${SCOPES}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT)}`
    + `&state=${state}`;

  res.json({ authUrl, state });
};

// ── GET /api/shopify/callback ─────────────────────────────────────────────────
const callback = async (req, res) => {
  const { shop, code, state } = req.query;
  if (!shop || !code) return res.status(400).send("Missing params");

  try {
    // Exchange code for token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id:     API_KEY,
      client_secret: API_SECRET,
      code,
    });
    const accessToken = tokenRes.data.access_token;

    // Get shop info
    const shopRes  = await shopify(shop, accessToken).get("/shop.json");
    const shopData = shopRes.data.shop;

    // Store in Firestore — keyed by uid from state (we encode uid:randomState)
    const uid = state.split(":")[0];
    if (uid) {
      await db.collection("shopify_stores").doc(uid).set({
        uid,
        shop,
        accessToken,
        shopName:  shopData.name,
        shopEmail: shopData.email,
        shopUrl:   shopData.domain,
        plan:      shopData.plan_name,
        currency:  shopData.currency,
        country:   shopData.country_name,
        connectedAt: new Date(),
      }, { merge: true });
    }

    // Redirect back to frontend
    res.redirect(`${FRONTEND}/dashboard/web-design?connected=1&shop=${shop}`);
  } catch (err) {
    console.error("Shopify callback error:", err.response?.data || err.message);
    res.redirect(`${FRONTEND}/dashboard/web-design?error=oauth_failed`);
  }
};

// ── GET /api/shopify/store ────────────────────────────────────────────────────
const getStore = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.json({ success: true, store: null });

    const { shop, accessToken, ...rest } = snap.data();
    try {
      const shopRes = await shopify(shop, accessToken).get("/shop.json");
      return res.json({ success: true, store: { shop, ...rest, live: shopRes.data.shop } });
    } catch {
      return res.json({ success: true, store: { shop, ...rest, live: null } });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to get store" });
  }
};

// ── DELETE /api/shopify/store ─────────────────────────────────────────────────
const disconnectStore = async (req, res) => {
  const uid = req.user.uid;
  try {
    await db.collection("shopify_stores").doc(uid).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to disconnect" });
  }
};

// ── GET /api/shopify/themes ───────────────────────────────────────────────────
const getThemes = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).get("/themes.json");
    res.json({ success: true, themes: r.data.themes });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch themes", error: err.response?.data });
  }
};

// ── PUT /api/shopify/themes/:id/publish ──────────────────────────────────────
const publishTheme = async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).put(`/themes/${id}.json`, {
      theme: { id: parseInt(id), role: "main" },
    });
    res.json({ success: true, theme: r.data.theme });
  } catch (err) {
    res.status(500).json({ message: "Failed to publish theme", error: err.response?.data });
  }
};

// ── GET /api/shopify/products ─────────────────────────────────────────────────
const getProducts = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).get("/products.json?limit=50");
    res.json({ success: true, products: r.data.products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.response?.data });
  }
};

// ── POST /api/shopify/products ────────────────────────────────────────────────
const createProduct = async (req, res) => {
  const uid = req.user.uid;
  const { title, body_html, vendor, product_type, price, images } = req.body;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).post("/products.json", {
      product: {
        title, body_html, vendor, product_type,
        variants: [{ price: price || "0.00" }],
        images: images || [],
      },
    });
    res.json({ success: true, product: r.data.product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.response?.data });
  }
};

// ── DELETE /api/shopify/products/:id ─────────────────────────────────────────
const deleteProduct = async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    await shopify(shop, accessToken).delete(`/products/${id}.json`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ── GET /api/shopify/pages ────────────────────────────────────────────────────
const getPages = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).get("/pages.json");
    res.json({ success: true, pages: r.data.pages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pages" });
  }
};

// ── GET /api/shopify/orders ───────────────────────────────────────────────────
const getOrders = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("shopify_stores").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ message: "No store connected" });
    const { shop, accessToken } = snap.data();
    const r = await shopify(shop, accessToken).get("/orders.json?status=any&limit=50");
    res.json({ success: true, orders: r.data.orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── GET /api/shopify/install-url ──────────────────────────────────────────────
const getInstallUrl = async (req, res) => {
  const uid  = req.user.uid;
  const shop = req.query.shop;
  if (!shop) return res.status(400).json({ message: "shop param required" });

  const state   = `${uid}:${crypto.randomBytes(8).toString("hex")}`;
  const authUrl = `https://${shop}/admin/oauth/authorize`
    + `?client_id=${API_KEY}`
    + `&scope=${SCOPES}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT)}`
    + `&state=${state}`;

  res.json({ authUrl });
};

module.exports = {
  install, callback, getStore, disconnectStore,
  getThemes, publishTheme,
  getProducts, createProduct, deleteProduct,
  getPages, getOrders, getInstallUrl,
};
