const Stripe = require("stripe");
const { db, admin } = require("../config/firebase");

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

/* ─────────────────────────────────────────────────────────────────────────────
   Stripe key validation — LKR is not supported by Stripe, so we use demo
   mode whenever no real Stripe key is configured (key must be > 50 chars
   and start with sk_test_ or sk_live_).
   Demo mode: skip Stripe API call entirely, simulate payment success.
───────────────────────────────────────────────────────────────────────────── */
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const DEMO_MODE  = !(STRIPE_KEY.length > 50 &&
                     (STRIPE_KEY.startsWith("sk_test_") || STRIPE_KEY.startsWith("sk_live_")));

const stripe = DEMO_MODE ? null : Stripe(STRIPE_KEY);

if (DEMO_MODE) {
  console.log("⚠️  Stripe demo mode active — payments will be simulated (no real charges)");
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helper – parse LKR string like "LKR 5,000/hr" → number
───────────────────────────────────────────────────────────────────────────── */
function parseLKR(str = "") {
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payments/create-intent
   Body: { hireRequestId }
   Creates a Stripe PaymentIntent (or demo simulation) + pending Firestore doc.
───────────────────────────────────────────────────────────────────────────── */
const createPaymentIntent = async (req, res) => {
  const clientUid = req.user.uid;
  const { hireRequestId } = req.body;

  if (!hireRequestId) {
    return res.status(400).json({ message: "hireRequestId is required" });
  }

  try {
    // ── 1. Load hire request ─────────────────────────────────────────────────
    const hireSnap = await db.collection("hire_requests").doc(hireRequestId).get();
    if (!hireSnap.exists) {
      return res.status(404).json({ message: "Hire request not found" });
    }
    const hire = hireSnap.data();

    if (hire.clientUid !== clientUid) {
      return res.status(403).json({ message: "Not your hire request" });
    }
    if (hire.paid) {
      return res.status(400).json({ message: "Already paid" });
    }
    if (hire.status !== "accepted") {
      return res.status(400).json({ message: "Freelancer has not accepted yet" });
    }

    // ── 2. Calculate amounts ─────────────────────────────────────────────────
    const amountLKR     = parseLKR(hire.budget || "0");
    const platformFee   = Math.round(amountLKR * PLATFORM_FEE_PERCENT / 100);
    const freelancerNet = amountLKR - platformFee;

    // ── 3. Load client & freelancer names ────────────────────────────────────
    const [clientSnap, freelancerSnap] = await Promise.all([
      db.collection("users").doc(clientUid).get(),
      db.collection("freelancer_profiles").doc(hire.freelancerUid).get(),
    ]);
    const clientName     = clientSnap.exists ? clientSnap.data().fullName || "Client" : "Client";
    const freelancerName = freelancerSnap.exists ? freelancerSnap.data().fullName || "Freelancer" : "Freelancer";

    // ── 4a. DEMO MODE — skip Stripe, simulate payment ────────────────────────
    if (DEMO_MODE) {
      const demoIntentId    = `demo_pi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const demoSecret      = `${demoIntentId}_secret_demo`;

      const paymentRef = db.collection("payments").doc();
      await paymentRef.set({
        id:                    paymentRef.id,
        hireRequestId,
        clientUid,
        freelancerUid:         hire.freelancerUid,
        clientName,
        freelancerName,
        serviceTitle:          hire.projectDescription || hire.serviceTitle || "Service",
        amount:                amountLKR,
        currency:              "LKR",
        platformFee,
        freelancerNet,
        platformFeePercent:    PLATFORM_FEE_PERCENT,
        method:                "demo",
        status:                "pending",
        stripePaymentIntentId: demoIntentId,
        stripeClientSecret:    demoSecret,
        createdAt:             admin.firestore.FieldValue.serverTimestamp(),
        paidAt:                null,
        releasedAt:            null,
        releaseNote:           null,
      });

      return res.json({
        success:      true,
        demo:         true,        // ← tells the frontend to show demo UI
        clientSecret: demoSecret,
        paymentId:    paymentRef.id,
        amount:       amountLKR,
        platformFee,
        freelancerNet,
        currency:     "LKR",
      });
    }

    // ── 4b. REAL STRIPE MODE ─────────────────────────────────────────────────
    // Stripe does not support LKR, so we process in USD (display in LKR).
    // Exchange rate: 1 USD ≈ 300 LKR (approximate; replace with live rate if needed)
    const USD_PER_LKR    = 1 / 300;
    const amountUSD      = Math.round(amountLKR * USD_PER_LKR * 100); // cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount:      amountUSD,
      currency:    "usd",
      description: `DM Assistant – ${hire.serviceTitle || "Service"} by ${freelancerName} (LKR ${amountLKR.toLocaleString()})`,
      metadata: {
        hireRequestId,
        clientUid,
        freelancerUid: hire.freelancerUid,
        amountLKR:     String(amountLKR),
        platformFee:   String(platformFee),
        freelancerNet: String(freelancerNet),
      },
    });

    // ── 5. Save pending payment to Firestore ─────────────────────────────────
    const paymentRef = db.collection("payments").doc();
    await paymentRef.set({
      id:                    paymentRef.id,
      hireRequestId,
      clientUid,
      freelancerUid:         hire.freelancerUid,
      clientName,
      freelancerName,
      serviceTitle:          hire.projectDescription || hire.serviceTitle || "Service",
      amount:                amountLKR,
      currency:              "LKR",
      platformFee,
      freelancerNet,
      platformFeePercent:    PLATFORM_FEE_PERCENT,
      method:                "stripe",
      status:                "pending",
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret:    paymentIntent.client_secret,
      createdAt:             admin.firestore.FieldValue.serverTimestamp(),
      paidAt:                null,
      releasedAt:            null,
      releaseNote:           null,
    });

    res.json({
      success:      true,
      demo:         false,
      clientSecret: paymentIntent.client_secret,
      paymentId:    paymentRef.id,
      amount:       amountLKR,
      platformFee,
      freelancerNet,
      currency:     "LKR",
    });
  } catch (err) {
    console.error("createPaymentIntent:", err.message);
    res.status(500).json({ message: "Failed to create payment intent", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payments/webhook
   Raw body required – Stripe signature verified.
───────────────────────────────────────────────────────────────────────────── */
const stripeWebhook = async (req, res) => {
  // Demo mode — no real Stripe, webhook not supported
  if (DEMO_MODE) return res.status(400).send("Demo mode — webhook not supported");

  const sig     = req.headers["stripe-signature"];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook sig failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const { hireRequestId, clientUid, freelancerUid, platformFee, freelancerNet } = pi.metadata;

    try {
      // Find the payment doc by stripePaymentIntentId
      const snap = await db.collection("payments")
        .where("stripePaymentIntentId", "==", pi.id)
        .limit(1)
        .get();

      if (!snap.empty) {
        const payDoc = snap.docs[0];
        await payDoc.ref.update({
          status:  "escrowed",
          paidAt:  admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark hire_request as paid
        await db.collection("hire_requests").doc(hireRequestId).update({
          paid:      true,
          paymentId: payDoc.id,
          paidAt:    admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify freelancer
        await db.collection("notifications").add({
          userId:    freelancerUid,
          type:      "payment_received",
          title:     "Payment Received! 💰",
          body:      `LKR ${Number(freelancerNet).toLocaleString()} is being held in escrow and will be released when the client approves the work.`,
          paymentId: payDoc.id,
          read:      false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify client
        await db.collection("notifications").add({
          userId:    clientUid,
          type:      "payment_success",
          title:     "Payment Successful ✅",
          body:      `Your payment of LKR ${Number(pi.amount / 100).toLocaleString()} is held in escrow. It will be released to the freelancer once you approve the work.`,
          paymentId: payDoc.id,
          read:      false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (dbErr) {
      console.error("Webhook DB update failed:", dbErr.message);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    try {
      const snap = await db.collection("payments")
        .where("stripePaymentIntentId", "==", pi.id)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ status: "failed" });
      }
    } catch (e) { console.error(e); }
  }

  res.json({ received: true });
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payments/release/:paymentId
   Client approves the work → releases escrow to freelancer
───────────────────────────────────────────────────────────────────────────── */
const releasePayment = async (req, res) => {
  const clientUid  = req.user.uid;
  const { paymentId } = req.params;
  const { note }      = req.body;

  try {
    const paySnap = await db.collection("payments").doc(paymentId).get();
    if (!paySnap.exists) return res.status(404).json({ message: "Payment not found" });

    const pay = paySnap.data();
    if (pay.clientUid !== clientUid) return res.status(403).json({ message: "Not authorized" });
    if (pay.status !== "escrowed") return res.status(400).json({ message: "Payment is not in escrow" });

    await paySnap.ref.update({
      status:      "released",
      releasedAt:  admin.firestore.FieldValue.serverTimestamp(),
      releaseNote: note || "",
    });

    // Update hire_request to completed
    await db.collection("hire_requests").doc(pay.hireRequestId).update({
      status:      "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify freelancer
    await db.collection("notifications").add({
      userId:    pay.freelancerUid,
      type:      "payment_released",
      title:     "Payment Released! 🎉",
      body:      `LKR ${Number(pay.freelancerNet).toLocaleString()} has been added to your available balance. Go to Payout Settings to withdraw your earnings.`,
      paymentId,
      read:      false,
      actionUrl: "/freelancer/payout-settings",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: "Payment released" });
  } catch (err) {
    console.error("releasePayment:", err.message);
    res.status(500).json({ message: "Failed to release payment" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/payments/client-history
   Client's full payment history
───────────────────────────────────────────────────────────────────────────── */
const getClientHistory = async (req, res) => {
  const clientUid = req.user.uid;
  try {
    const snap = await db.collection("payments")
      .where("clientUid", "==", clientUid)
      .get();

    const payments = snap.docs
      .map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt:   data.createdAt?.toDate?.()?.toISOString() || null,
          paidAt:      data.paidAt?.toDate?.()?.toISOString()    || null,
          releasedAt:  data.releasedAt?.toDate?.()?.toISOString()|| null,
          _ts:         data.createdAt?.toMillis?.() || 0,
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/payments/status/:paymentId
───────────────────────────────────────────────────────────────────────────── */
const getPaymentStatus = async (req, res) => {
  const uid       = req.user.uid;
  const { paymentId } = req.params;
  try {
    const snap = await db.collection("payments").doc(paymentId).get();
    if (!snap.exists) return res.status(404).json({ message: "Not found" });
    const data = snap.data();
    if (data.clientUid !== uid && data.freelancerUid !== uid) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json({
      success: true,
      payment: {
        ...data,
        id: snap.id,
        createdAt:  data.createdAt?.toDate?.()?.toISOString()  || null,
        paidAt:     data.paidAt?.toDate?.()?.toISOString()     || null,
        releasedAt: data.releasedAt?.toDate?.()?.toISOString() || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment status" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payments/demo-confirm
   Body: { paymentId }
   Demo-mode only: immediately marks a pending payment as escrowed.
   Called by the frontend when the user clicks "Confirm Demo Payment".
───────────────────────────────────────────────────────────────────────────── */
const demoConfirmPayment = async (req, res) => {
  const clientUid   = req.user.uid;
  const { paymentId } = req.body;

  if (!paymentId) return res.status(400).json({ message: "paymentId is required" });

  try {
    const paySnap = await db.collection("payments").doc(paymentId).get();
    if (!paySnap.exists) return res.status(404).json({ message: "Payment not found" });

    const pay = paySnap.data();
    if (pay.clientUid !== clientUid) return res.status(403).json({ message: "Not authorized" });
    if (pay.method !== "demo") return res.status(400).json({ message: "Not a demo payment" });
    if (pay.status !== "pending") return res.status(400).json({ message: "Already processed" });

    // Mark as escrowed
    await paySnap.ref.update({
      status: "escrowed",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark hire request as paid
    await db.collection("hire_requests").doc(pay.hireRequestId).update({
      paid:      true,
      paymentId,
      paidAt:    admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify freelancer
    await db.collection("notifications").add({
      userId:    pay.freelancerUid,
      type:      "payment",
      title:     "Payment Received! 💰",
      body:      `LKR ${Number(pay.freelancerNet).toLocaleString()} is held in escrow for "${pay.serviceTitle}". It will be released when the client approves the work.`,
      paymentId,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify client
    await db.collection("notifications").add({
      userId:    clientUid,
      type:      "payment",
      title:     "Payment Successful ✅",
      body:      `LKR ${Number(pay.amount).toLocaleString()} is held in escrow for "${pay.serviceTitle}". It'll be released to ${pay.freelancerName} once you approve the work.`,
      paymentId,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("demoConfirmPayment:", err.message);
    res.status(500).json({ message: "Failed to confirm demo payment" });
  }
};

module.exports = {
  createPaymentIntent,
  stripeWebhook,
  releasePayment,
  getClientHistory,
  getPaymentStatus,
  demoConfirmPayment,
};
