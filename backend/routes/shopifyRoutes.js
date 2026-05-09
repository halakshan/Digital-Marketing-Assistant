const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  install, callback, getStore, disconnectStore,
  getThemes, publishTheme,
  getProducts, createProduct, deleteProduct,
  getPages, getOrders, getInstallUrl,
} = require("../controllers/shopifyController");

// OAuth (no auth required — public endpoints)
router.get("/install",  install);
router.get("/callback", callback);

// Authenticated install URL (encodes uid in state)
router.get("/install-url", protect, getInstallUrl);

// Store
router.get("/store",    protect, getStore);
router.delete("/store", protect, disconnectStore);

// Themes
router.get("/themes",              protect, getThemes);
router.put("/themes/:id/publish",  protect, publishTheme);

// Products
router.get("/products",     protect, getProducts);
router.post("/products",    protect, createProduct);
router.delete("/products/:id", protect, deleteProduct);

// Pages
router.get("/pages", protect, getPages);

// Orders
router.get("/orders", protect, getOrders);

module.exports = router;
