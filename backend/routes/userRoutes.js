const express  = require("express");
const router   = express.Router();
const { admin } = require("../config/firebase");
const { protect: verifyToken } = require("../middleware/authMiddleware");
const { sendMail, emailVerificationTemplate, welcomeTemplate } = require("../utils/mailer");

// GET /api/users/test
router.get("/test", (req, res) => {
  res.json({ message: "User routes working ✅" });
});

// POST /api/users/send-verification — send email verification link
router.post("/send-verification", verifyToken, async (req, res) => {
  try {
    const uid      = req.user.uid;
    const userDoc  = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data() || {};
    const email    = userData.email || req.user.email;
    const name     = userData.fullName || "there";

    // Generate Firebase email verification link
    const verifyUrl = await admin.auth().generateEmailVerificationLink(email, {
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
    });

    await sendMail({
      to:      email,
      subject: "✅ Verify your DM Assistant email",
      html:    emailVerificationTemplate(name, verifyUrl),
    });

    res.json({ success: true, message: "Verification email sent!" });
  } catch (err) {
    console.error("send-verification error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send verification email." });
  }
});

// POST /api/users/welcome — send welcome email after registration
router.post("/welcome", verifyToken, async (req, res) => {
  try {
    const uid      = req.user.uid;
    const userDoc  = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data() || {};
    const email    = userData.email || req.user.email;
    const name     = userData.fullName || "there";
    const role     = userData.role || "business";

    await sendMail({
      to:      email,
      subject: "🎉 Welcome to DM Assistant!",
      html:    welcomeTemplate(name, role),
    });

    res.json({ success: true });
  } catch (err) {
    // Non-critical — don't block registration flow
    console.error("welcome email error:", err.message);
    res.json({ success: false, message: "Welcome email failed (non-critical)" });
  }
});

// POST /api/users/upgrade-plan
// Updates the user's plan in Firestore (called from upgrade page)
// When Stripe is configured this will redirect to Stripe Checkout instead
router.post("/upgrade-plan", verifyToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const uid      = req.user.uid;

    const validPlans = ["free", "pro", "business"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan." });
    }

    // If Stripe secret key is configured → create a Stripe checkout session
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const hasStripe = stripeKey && !stripeKey.includes("YOUR_STRIPE");

    if (hasStripe && plan !== "free") {
      const stripe = require("stripe")(stripeKey);
      const PRICE_IDS = {
        pro:      process.env.STRIPE_PRICE_PRO      || "",
        business: process.env.STRIPE_PRICE_BUSINESS || "",
      };
      const priceId = PRICE_IDS[plan];

      if (priceId) {
        // Get or create Stripe customer
        const userDoc  = await admin.firestore().collection("users").doc(uid).get();
        const userData = userDoc.data() || {};
        let customerId = userData.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email:    userData.email || req.user.email,
            metadata: { firebaseUid: uid },
          });
          customerId = customer.id;
          await admin.firestore().collection("users").doc(uid).update({ stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
          customer:             customerId,
          mode:                 "subscription",
          payment_method_types: ["card"],
          line_items:           [{ price: priceId, quantity: 1 }],
          success_url:          `${process.env.FRONTEND_URL}/dashboard/upgrade?success=true`,
          cancel_url:           `${process.env.FRONTEND_URL}/dashboard/upgrade?cancelled=true`,
          metadata:             { firebaseUid: uid, plan },
        });

        return res.json({ success: true, checkoutUrl: session.url });
      }
    }

    // Fallback: directly update Firestore (dev mode / no Stripe yet)
    await admin.firestore().collection("users").doc(uid).update({
      plan,
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, plan, message: `Plan updated to ${plan}` });
  } catch (err) {
    console.error("upgrade-plan error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to upgrade plan" });
  }
});

// GET /api/users/me — get current user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const snap = await admin.firestore().collection("users").doc(req.user.uid).get();
    if (!snap.exists()) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: { id: snap.id, ...snap.data() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/me — update profile
router.put("/me", verifyToken, async (req, res) => {
  try {
    const allowed = ["fullName","businessName","phone","language","profilePhoto","bio"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection("users").doc(req.user.uid).update(updates);
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
