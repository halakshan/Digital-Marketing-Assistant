/**
 * deploy-rules.js — uses the backend's existing admin SDK config
 * Run from project root: node deploy-rules.js
 */

const path  = require("path");
const fs    = require("fs");
const https = require("https");

// Reuse backend dotenv
require(path.join(__dirname, "backend", "node_modules", "dotenv")).config({
  path: path.join(__dirname, "backend", ".env"),
});

const admin = require(path.join(__dirname, "backend", "node_modules", "firebase-admin"));

// Initialise if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID;
const rulesContent = fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8");

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: "POST", headers }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end",  () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpsPatch(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: "PATCH", headers }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end",  () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function deploy() {
  console.log("🔑 Getting access token from Firebase Admin SDK...");
  const token = await admin.app().options.credential.getAccessToken();
  const accessToken = token.access_token;
  console.log("✅ Token obtained");

  // Create ruleset
  const rulesetPayload = JSON.stringify({
    source: { files: [{ name: "firestore.rules", content: rulesContent }] },
  });

  console.log("📤 Creating ruleset...");
  const r1 = await httpsPost(
    "firebaserules.googleapis.com",
    `/v1/projects/${PROJECT_ID}/rulesets`,
    {
      "Authorization":  `Bearer ${accessToken}`,
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(rulesetPayload),
    },
    rulesetPayload
  );

  if (r1.status !== 200) {
    console.error("❌ Ruleset creation failed:", JSON.stringify(r1.body, null, 2));
    process.exit(1);
  }
  const rulesetName = r1.body.name;
  console.log("✅ Ruleset created:", rulesetName);

  // Update release
  const releaseName    = `projects/${PROJECT_ID}/releases/cloud.firestore`;
  const releasePayload = JSON.stringify({ release: { name: releaseName, rulesetName } });

  console.log("🔗 Updating release...");
  const r2 = await httpsPatch(
    "firebaserules.googleapis.com",
    `/v1/${releaseName}`,
    {
      "Authorization":  `Bearer ${accessToken}`,
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(releasePayload),
    },
    releasePayload
  );

  if (r2.status !== 200) {
    console.error("❌ Release update failed:", JSON.stringify(r2.body, null, 2));
    process.exit(1);
  }

  console.log("🎉 Firestore rules deployed successfully to:", PROJECT_ID);
}

deploy().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
