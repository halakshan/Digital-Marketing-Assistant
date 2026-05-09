const { db } = require("../config/firebase");

// ── POST /api/reviews ─────────────────────────────────────────────────────────
const submitReview = async (req, res) => {
  const clientUid = req.user.uid;
  const { hireRequestId, stars, text } = req.body;

  // Validate inputs
  if (!hireRequestId || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "Stars must be between 1 and 5." });
  }

  try {
    // 1. Verify the hire request exists, belongs to this client, and is completed
    const hireSnap = await db.collection("hire_requests").doc(hireRequestId).get();
    if (!hireSnap.exists) {
      return res.status(404).json({ message: "Hire request not found" });
    }
    const hire = hireSnap.data();
    if (hire.clientUid !== clientUid) {
      return res.status(403).json({ message: "You don't have permission to review this request" });
    }
    if (hire.status !== "completed") {
      return res.status(400).json({ message: "You can only review completed projects" });
    }

    // 2. Prevent duplicate reviews
    const existing = await db.collection("reviews")
      .where("hireRequestId", "==", hireRequestId)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ message: "You already submitted a review for this project" });
    }

    // 3. Get client's display name
    const userSnap = await db.collection("users").doc(clientUid).get();
    const clientName = userSnap.exists ? (userSnap.data().fullName || "Client") : "Client";

    // 4. Write the review document
    await db.collection("reviews").add({
      freelancerUid: hire.freelancerUid,
      clientUid,
      clientName,
      hireRequestId,
      stars:     Number(stars),
      text:      (text || "").trim(),
      createdAt: new Date(),
    });

    // 5. Recompute freelancer's average rating from all reviews
    const allSnap = await db.collection("reviews")
      .where("freelancerUid", "==", hire.freelancerUid)
      .get();

    const reviewCount = allSnap.size;
    const totalStars  = allSnap.docs.reduce((sum, d) => sum + (d.data().stars || 0), 0);
    const newRating   = reviewCount > 0
      ? Math.round((totalStars / reviewCount) * 10) / 10
      : 0;

    await db.collection("freelancer_profiles").doc(hire.freelancerUid).set(
      { rating: newRating, reviewCount },
      { merge: true }
    );

    // 6. Notify the freelancer
    await db.collection("notifications").add({
      userId:    hire.freelancerUid,
      type:      "social",
      title:     `New ${stars}-Star Review ⭐`,
      body:      `${clientName} left you a review: "${(text || "").slice(0, 60)}${text && text.length > 60 ? "…" : ""}"`,
      read:      false,
      actionUrl: "/freelancer/profile",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Review submitted!", rating: newRating, reviewCount });
  } catch (err) {
    console.error("submitReview:", err.message);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

// ── GET /api/reviews/my-reviews ───────────────────────────────────────────────
// Returns all review docs where clientUid matches — used to know which hires
// the current client has already reviewed (prevents duplicate review UI).
const getMyReviews = async (req, res) => {
  const clientUid = req.user.uid;
  try {
    const snap = await db.collection("reviews")
      .where("clientUid", "==", clientUid)
      .get();
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("getMyReviews:", err.message);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

module.exports = { submitReview, getMyReviews };
