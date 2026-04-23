const { db } = require("../config/firebase");

// ── POST /api/messages/start ──────────────────────────────────────────────────
// Start or retrieve an existing conversation between current user + another user
const startConversation = async (req, res) => {
  const { otherUid, otherName, otherPhoto } = req.body;
  const myUid = req.user.uid;

  if (!otherUid) return res.status(400).json({ message: "otherUid is required" });

  try {
    // Fetch caller's profile
    const mySnap = await db.collection("users").doc(myUid).get();
    const myData = mySnap.exists ? mySnap.data() : {};
    const myName  = myData.fullName || myData.displayName || "User";
    const myPhoto = myData.profilePhoto || "";
    const myRole  = myData.role || "business";

    // Determine client/freelancer depending on role
    const isFreelancer = myRole === "freelancer";
    const clientUid    = isFreelancer ? otherUid   : myUid;
    const freelancerUid = isFreelancer ? myUid      : otherUid;

    // Check existing conversation
    const existing = await db.collection("conversations")
      .where("clientUid",     "==", clientUid)
      .where("freelancerUid", "==", freelancerUid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.json({ success: true, conversationId: existing.docs[0].id });
    }

    // Fetch the other user's profile if names not provided
    const otherSnap = await db.collection("users").doc(otherUid).get();
    const otherData = otherSnap.exists ? otherSnap.data() : {};
    const resolvedOtherName  = otherName  || otherData.fullName  || "User";
    const resolvedOtherPhoto = otherPhoto || otherData.profilePhoto || "";

    const docRef = await db.collection("conversations").add({
      clientUid,
      clientName:     isFreelancer ? resolvedOtherName  : myName,
      clientPhoto:    isFreelancer ? resolvedOtherPhoto : myPhoto,
      freelancerUid,
      freelancerName: isFreelancer ? myName              : resolvedOtherName,
      freelancerPhoto:isFreelancer ? myPhoto             : resolvedOtherPhoto,
      lastMessage:    "",
      lastMessageAt:  new Date(),
      lastSenderUid:  "",
      unreadClient:   0,
      unreadFreelancer: 0,
      createdAt:      new Date(),
    });

    res.json({ success: true, conversationId: docRef.id });
  } catch (err) {
    console.error("startConversation:", err.message);
    res.status(500).json({ message: "Failed to start conversation" });
  }
};

// ── GET /api/messages/conversations ──────────────────────────────────────────
// List all conversations for current user (client or freelancer)
const getConversations = async (req, res) => {
  const uid = req.user.uid;
  try {
    const [asClient, asFreelancer] = await Promise.all([
      db.collection("conversations").where("clientUid",     "==", uid).get(),
      db.collection("conversations").where("freelancerUid", "==", uid).get(),
    ]);

    const seen = new Set();
    const convs = [];
    [...asClient.docs, ...asFreelancer.docs].forEach(doc => {
      if (seen.has(doc.id)) return;
      seen.add(doc.id);
      const d = doc.data();
      convs.push({
        id: doc.id,
        ...d,
        lastMessageAt: d.lastMessageAt?.toDate?.() || d.lastMessageAt,
        createdAt:     d.createdAt?.toDate?.()     || d.createdAt,
      });
    });

    convs.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json({ success: true, conversations: convs });
  } catch (err) {
    console.error("getConversations:", err.message);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

module.exports = { startConversation, getConversations };
