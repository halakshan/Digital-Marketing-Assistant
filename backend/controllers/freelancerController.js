const { db } = require("../config/firebase");

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Safely convert any Firestore timestamp / Date / plain-object to ISO string */
function toISO(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();   // Firestore Timestamp
  if (ts._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString(); // plain {_seconds}
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === "string") return ts;
  return null;
}

/** Safely parse a numeric amount — handles numbers, formatted strings like "LKR 2,500" */
function toNum(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") return Number(val.replace(/[^0-9.]/g, "")) || 0;
  return 0;
}

// ── GET /api/freelancer/profile ───────────────────────────────────────────────
const getProfile = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("freelancer_profiles").doc(uid).get();
    if (!snap.exists) return res.json({ success: true, profile: null });
    res.json({ success: true, profile: { uid, ...snap.data() } });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ── PUT /api/freelancer/profile ───────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const uid = req.user.uid;
  const { fullName, category, bio, skills, rate, location, profilePhoto, available } = req.body;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const userName = fullName || (userSnap.exists ? userSnap.data().fullName : "Freelancer");

    // Profile is "complete" when name, category and bio are all filled
    const profileComplete = !!(userName && category && bio);

    await db.collection("freelancer_profiles").doc(uid).set({
      uid,
      fullName:        userName,
      category:        category  || "",
      bio:             bio       || "",
      skills:          skills    || [],
      rate:            rate      || "",
      location:        location  || "",
      profilePhoto:    profilePhoto || "",
      available:       available !== undefined ? available : true,
      profileComplete,
      updatedAt:       new Date(),
    }, { merge: true });

    // Also keep users doc in sync + mark as freelancer
    await db.collection("users").doc(uid).set({
      fullName:     userName,
      isFreelancer: true,   // grants Freelancer Hub access in sidebar
      updatedAt:    new Date(),
    }, { merge: true });

    res.json({ success: true, message: "Profile updated", profileComplete });
  } catch (err) {
    console.error("updateProfile:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ── GET /api/freelancer/requests ──────────────────────────────────────────────
const getRequests = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("hire_requests")
      .where("freelancerUid", "==", uid)
      .get();

    const requests = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toISO(doc.data().createdAt),
        updatedAt: toISO(doc.data().updatedAt),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, requests });
  } catch (err) {
    console.error("getRequests:", err.message);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// ── PUT /api/freelancer/requests/:id ─────────────────────────────────────────
const respondToRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "accepted" | "declined" | "completed"
  const uid = req.user.uid;

  if (!["accepted", "declined", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const docRef = db.collection("hire_requests").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: "Request not found" });
    if (snap.data().freelancerUid !== uid) return res.status(403).json({ message: "Forbidden" });

    await docRef.update({ status, updatedAt: new Date() });

    // Get freelancer name for notification
    const profileSnap = await db.collection("freelancer_profiles").doc(uid).get();
    const freelancerName = profileSnap.exists ? profileSnap.data().fullName : "Freelancer";

    // Notify client
    const statusLabel = status === "accepted" ? "accepted" : status === "declined" ? "declined" : "marked as completed";
    await db.collection("notifications").add({
      userId:    snap.data().clientUid,
      type:      "social",
      title:     `Hire Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body:      `${freelancerName} has ${statusLabel} your hire request.`,
      read:      false,
      actionUrl: "/dashboard/marketplace?tab=hires",
      createdAt: new Date(),
    });

    // If accepted, increment active projects count on freelancer profile
    if (status === "accepted") {
      await db.collection("freelancer_profiles").doc(uid).update({
        activeProjects: (profileSnap.exists ? (profileSnap.data().activeProjects || 0) : 0) + 1,
      });
    }

    // If completed, increment completedOrders
    if (status === "completed") {
      const current = profileSnap.exists ? (profileSnap.data().completedOrders || 0) : 0;
      await db.collection("freelancer_profiles").doc(uid).update({ completedOrders: current + 1 });
    }

    res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    console.error("respondToRequest:", err.message);
    res.status(500).json({ message: "Failed to update request" });
  }
};

// ── GET /api/freelancer/stats ─────────────────────────────────────────────────
const getStats = async (req, res) => {
  const uid = req.user.uid;
  try {
    const [profileSnap, requestsSnap, paymentsSnap] = await Promise.all([
      db.collection("freelancer_profiles").doc(uid).get(),
      db.collection("hire_requests").where("freelancerUid", "==", uid).get(),
      db.collection("payments").where("freelancerUid", "==", uid).where("status", "==", "released").get(),
    ]);

    const profile = profileSnap.exists ? profileSnap.data() : {};
    const allRequests = requestsSnap.docs.map(d => d.data());

    const pending   = allRequests.filter(r => r.status === "pending").length;
    const active    = allRequests.filter(r => r.status === "accepted").length;
    const completed = allRequests.filter(r => r.status === "completed").length;

    // Sum released payments directly — never stale
    const totalEarnings = paymentsSnap.docs.reduce((sum, doc) => {
      const d = doc.data();
      return sum + toNum(d.freelancerNet ?? d.amountNumeric ?? d.amount ?? 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalEarnings,
        activeProjects:  active,
        pendingRequests: pending,
        completedOrders: completed || profile.completedOrders || 0,
        rating:          profile.rating     || 0,
        reviewCount:     profile.reviewCount || 0,
      },
    });
  } catch (err) {
    console.error("getStats:", err.message);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// ── GET /api/freelancer/payments ──────────────────────────────────────────────
const getPayments = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("payments")
      .where("freelancerUid", "==", uid)
      .get();

    const payments = snap.docs
      .map(doc => {
        const d = doc.data();
        // Use nullish coalescing so 0 is kept; then sanitize to a real number
        const net = toNum(d.freelancerNet ?? d.amountNumeric ?? d.amount ?? 0);
        return {
          id:            doc.id,
          hireRequestId: d.hireRequestId || "",
          clientName:    d.clientName    || "Client",
          projectTitle:  d.serviceTitle  || d.projectTitle || d.projectDescription || "Project",
          amount:        `LKR ${net.toLocaleString()}`,   // formatted string
          amountNumeric: net,                              // guaranteed number
          method:        d.method        || "card",
          note:          d.releaseNote   || "",
          status:        d.status        || "pending",
          freelancerNet: net,
          platformFee:   toNum(d.platformFee),
          createdAt:     toISO(d.createdAt),
          paidAt:        toISO(d.paidAt),
          releasedAt:    toISO(d.releasedAt),
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, payments });
  } catch (err) {
    console.error("getPayments:", err.message);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

module.exports = { getProfile, updateProfile, getRequests, respondToRequest, getStats, getPayments };
