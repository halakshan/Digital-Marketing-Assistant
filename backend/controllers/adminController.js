const { db, admin } = require("../config/firebase");

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/admin/withdrawals
   List all withdrawal requests (newest first), optionally filtered by status
───────────────────────────────────────────────────────────────────────────── */
const listWithdrawals = async (req, res) => {
  const { status } = req.query; // optional filter: pending | processing | completed | rejected
  try {
    let q = db.collection("withdrawal_requests");
    if (status) q = q.where("status", "==", status);
    const snap = await q.get();

    const withdrawals = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id:           d.id,
          ...data,
          createdAt:    data.createdAt?.toDate?.()?.toISOString()   || null,
          processedAt:  data.processedAt?.toDate?.()?.toISOString() || null,
          _ts:          data.createdAt?.toMillis?.() || 0,
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest);

    res.json({ success: true, withdrawals });
  } catch (err) {
    console.error("listWithdrawals:", err.message);
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/admin/withdrawals/:id
   Update a withdrawal's status: pending → processing → completed | rejected
   Body: { status, note? }
───────────────────────────────────────────────────────────────────────────── */
const updateWithdrawal = async (req, res) => {
  const { id }           = req.params;
  const { status, note } = req.body;

  const VALID = ["pending", "processing", "completed", "rejected"];
  if (!VALID.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID.join(", ")}` });
  }

  try {
    const wdRef  = db.collection("withdrawal_requests").doc(id);
    const wdSnap = await wdRef.get();
    if (!wdSnap.exists) return res.status(404).json({ message: "Withdrawal not found" });

    const wd = wdSnap.data();

    const updateData = {
      status,
      note:        note || wd.note || "",
      processedAt: ["completed", "rejected"].includes(status)
        ? admin.firestore.FieldValue.serverTimestamp()
        : wd.processedAt || null,
    };
    await wdRef.update(updateData);

    // ── Notify freelancer on final status ────────────────────────────────────
    if (status === "completed") {
      await db.collection("notifications").add({
        userId:    wd.freelancerUid,
        type:      "payment",
        title:     "Withdrawal Completed! 🎉",
        body:      `LKR ${Number(wd.amount).toLocaleString()} has been sent to ${wd.accountLabel}. Check your account within 1–3 business days.`,
        read:      false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update freelancer profile totalEarnings
      const profileRef  = db.collection("freelancer_profiles").doc(wd.freelancerUid);
      const profileSnap = await profileRef.get();
      const current     = profileSnap.exists ? (profileSnap.data().totalEarnings || 0) : 0;
      await profileRef.update({ totalEarnings: current + Number(wd.amount) });

    } else if (status === "rejected") {
      await db.collection("notifications").add({
        userId:    wd.freelancerUid,
        type:      "payment",
        title:     "Withdrawal Rejected ❌",
        body:      note
          ? `Your withdrawal of LKR ${Number(wd.amount).toLocaleString()} was rejected: ${note}`
          : `Your withdrawal of LKR ${Number(wd.amount).toLocaleString()} was rejected. Please contact support.`,
        read:      false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    } else if (status === "processing") {
      await db.collection("notifications").add({
        userId:    wd.freelancerUid,
        type:      "payment",
        title:     "Withdrawal Processing ⏳",
        body:      `Your withdrawal of LKR ${Number(wd.amount).toLocaleString()} is being processed. Expected within 1–3 business days.`,
        read:      false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ success: true, message: `Withdrawal updated to: ${status}` });
  } catch (err) {
    console.error("updateWithdrawal:", err.message);
    res.status(500).json({ message: "Failed to update withdrawal" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/admin/stats
   Overview stats for the admin
───────────────────────────────────────────────────────────────────────────── */
const getAdminStats = async (req, res) => {
  try {
    const [usersSnap, paymentsSnap, withdrawalsSnap, hiresSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("payments").get(),
      db.collection("withdrawal_requests").get(),
      db.collection("hire_requests").get(),
    ]);

    let totalEscrow   = 0;
    let totalReleased = 0;
    let platformFees  = 0;

    paymentsSnap.docs.forEach(d => {
      const data = d.data();
      if (data.status === "escrowed") totalEscrow   += (data.amount        || 0);
      if (data.status === "released") totalReleased += (data.freelancerNet || 0);
      platformFees += (data.platformFee || 0);
    });

    const pendingWithdrawals = withdrawalsSnap.docs.filter(d => d.data().status === "pending").length;

    res.json({
      success: true,
      stats: {
        totalUsers:          usersSnap.size,
        totalPayments:       paymentsSnap.size,
        totalEscrow,
        totalReleased,
        platformFees,
        pendingWithdrawals,
        totalHires:          hiresSnap.size,
      },
    });
  } catch (err) {
    console.error("getAdminStats:", err.message);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/admin/set-admin
   Grant admin role to a user (only usable by existing admins)
   Body: { targetUid }
───────────────────────────────────────────────────────────────────────────── */
const setAdmin = async (req, res) => {
  const { targetUid, remove } = req.body;
  if (!targetUid) return res.status(400).json({ message: "targetUid required" });
  try {
    await db.collection("users").doc(targetUid).update({
      isAdmin: remove ? false : true,
    });
    res.json({ success: true, message: remove ? "Admin removed" : "Admin granted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update admin status" });
  }
};

module.exports = { listWithdrawals, updateWithdrawal, getAdminStats, setAdmin };
