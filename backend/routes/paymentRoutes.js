const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createPaymentIntent,
  stripeWebhook,
  releasePayment,
  getClientHistory,
  getPaymentStatus,
  demoConfirmPayment,
} = require("../controllers/paymentController");

// Stripe webhook needs raw body – must be BEFORE express.json() globally
// We handle this by using express.raw() inline for this route
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.post("/create-intent",       protect, createPaymentIntent);
router.post("/demo-confirm",        protect, demoConfirmPayment);
router.post("/release/:paymentId",  protect, releasePayment);
router.get("/client-history",       protect, getClientHistory);
router.get("/status/:paymentId",    protect, getPaymentStatus);

module.exports = router;
