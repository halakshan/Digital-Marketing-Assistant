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

db.collection("users").get().then(snap => {
  console.log(`\n Found ${snap.size} users:\n`);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`  UID: ${d.id}`);
    console.log(`  Name: ${data.fullName || "?"}`);
    console.log(`  Email: ${data.email || "?"}`);
    console.log(`  isAdmin: ${data.isAdmin || false}`);
    console.log(`  isFreelancer: ${data.isFreelancer || false}`);
    console.log("  ─────────────────────────────────");
  });
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
