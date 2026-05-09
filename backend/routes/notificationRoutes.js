const express  = require("express");
const router   = express.Router();
const { admin } = require("../config/firebase");
const { protect } = require("../middleware/authMiddleware");

// GET /api/notifications — fetch user's notifications (newest first)
router.get("/", protect, async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await admin.firestore()
      .collection("notifications")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
    }));

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Get notifications error:", err.message);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch("/:id/read", protect, async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;
  try {
    const doc = await admin.firestore().collection("notifications").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(403).json({ message: "Notification not found" });
    }
    await admin.firestore().collection("notifications").doc(id).update({ read: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err.message);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", protect, async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await admin.firestore()
      .collection("notifications")
      .where("userId", "==", uid)
      .where("read", "==", false)
      .get();

    const batch = admin.firestore().batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();

    res.json({ success: true, marked: snap.size });
  } catch (err) {
    console.error("Mark all read error:", err.message);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id — delete a notification
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;
  try {
    const doc = await admin.firestore().collection("notifications").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(403).json({ message: "Notification not found" });
    }
    await admin.firestore().collection("notifications").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete notification error:", err.message);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;
