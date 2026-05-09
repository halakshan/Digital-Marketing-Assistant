const { db } = require("../config/firebase");

/* ─────────────────────────────────────────────────────────────────────────────
   Admin middleware — checks Firestore users/{uid}.isAdmin === true
   Run AFTER protect middleware (req.user must be set)
───────────────────────────────────────────────────────────────────────────── */
const adminOnly = async (req, res, next) => {
  try {
    const uid  = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists || snap.data().isAdmin !== true) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Admin check failed" });
  }
};

module.exports = { adminOnly };
