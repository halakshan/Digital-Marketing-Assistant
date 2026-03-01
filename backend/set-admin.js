require("dotenv").config();
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
const db = admin.firestore();

// Grant admin to Pathumi Dilmika (platform owner)
const ADMIN_UID = "dGUOKVGUcSSGfzqXEYssanieSPh2";

db.collection("users").doc(ADMIN_UID).update({ isAdmin: true })
  .then(() => {
    console.log(`✅ Admin granted to UID: ${ADMIN_UID}`);
    process.exit(0);
  })
  .catch(e => { console.error("❌", e.message); process.exit(1); });
