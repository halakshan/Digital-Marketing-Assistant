const { db } = require("../config/firebase");

// ── GET /api/marketplace/freelancers ─────────────────────────────────────────
const getFreelancers = async (req, res) => {
  try {
    const snap = await db.collection("freelancer_profiles").get();

    const freelancers = snap.docs.map(doc => {
      const d = doc.data();
      // Normalise field names — support both old (displayName/hourlyRate) and new (fullName/rate)
      const fullName = d.fullName || d.displayName || "";
      const rate     = d.rate || (d.hourlyRate ? `LKR ${d.hourlyRate}/hr` : "");

      return {
        uid:            doc.id,
        fullName,
        category:       d.category       || "",
        bio:            d.bio             || "",
        skills:         d.skills          || [],
        rate,
        location:       d.location        || "",
        profilePhoto:   d.profilePhoto    || "",
        verified:       d.verified        || false,
        rating:         d.rating          || 0,
        reviewCount:    d.reviewCount     || d.totalReviews || 0,
        completedOrders:d.completedOrders || 0,
        available:      d.available !== undefined ? d.available : true,
        // A profile is "complete" if it has a category and bio filled in
        profileComplete: !!(d.category && d.bio && d.fullName),
        createdAt:      d.createdAt?.toDate?.() || d.createdAt,
      };
    });

    res.json({ success: true, freelancers });
  } catch (err) {
    console.error("getFreelancers:", err.message);
    res.status(500).json({ message: "Failed to fetch freelancers" });
  }
};

// ── POST /api/marketplace/hire ────────────────────────────────────────────────
const sendHireRequest = async (req, res) => {
  const { freelancerUid, freelancerName, projectDescription, budget } = req.body;
  const clientUid = req.user.uid;

  if (!freelancerUid || !projectDescription) {
    return res.status(400).json({ message: "Freelancer and project description are required" });
  }

  try {
    const userSnap   = await db.collection("users").doc(clientUid).get();
    const clientName = userSnap.exists ? (userSnap.data().fullName || "Client") : "Client";

    // Check for existing pending request
    const existing = await db.collection("hire_requests")
      .where("clientUid",     "==", clientUid)
      .where("freelancerUid", "==", freelancerUid)
      .where("status",        "==", "pending")
      .get();

    if (!existing.empty) {
      return res.status(400).json({ message: "You already have a pending request with this freelancer" });
    }

    const docRef = await db.collection("hire_requests").add({
      clientUid,
      clientName,
      freelancerUid,
      freelancerName: freelancerName || "Freelancer",
      projectDescription,
      budget:    budget || "Negotiable",
      status:    "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Notify freelancer
    await db.collection("notifications").add({
      userId:    freelancerUid,
      type:      "social",
      title:     "New Hire Request 🎉",
      body:      `${clientName} wants to hire you: "${projectDescription.slice(0, 80)}..."`,
      read:      false,
      actionUrl: "/freelancer/proposals",
      createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id, message: "Hire request sent!" });
  } catch (err) {
    console.error("sendHireRequest:", err.message);
    res.status(500).json({ message: "Failed to send hire request" });
  }
};

// ── GET /api/marketplace/my-hires ────────────────────────────────────────────
const getMyHires = async (req, res) => {
  const clientUid = req.user.uid;
  try {
    const snap = await db.collection("hire_requests")
      .where("clientUid", "==", clientUid)
      .get();

    const hires = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, hires });
  } catch (err) {
    console.error("getMyHires:", err.message);
    res.status(500).json({ message: "Failed to fetch hire requests" });
  }
};

module.exports = { getFreelancers, sendHireRequest, getMyHires };
