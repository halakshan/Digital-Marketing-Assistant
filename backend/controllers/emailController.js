const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db }                  = require("../config/firebase");
const { sendMail }            = require("../utils/mailer");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── HTML email wrapper ────────────────────────────────────────────────────────
function buildHtml(subject, bodyText, fromName) {
  const bodyHtml = bodyText.includes("<")
    ? bodyText
    : bodyText.replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
  .wrap{max-width:620px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:28px 40px;color:#fff}
  .hdr h2{margin:0;font-size:22px}
  .hdr p{margin:4px 0 0;opacity:.8;font-size:13px}
  .body{padding:32px 40px;color:#333;line-height:1.7;font-size:15px}
  .footer{padding:18px 40px;background:#f9f9f9;color:#888;font-size:12px;border-top:1px solid #eee}
  a{color:#7c3aed}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <h2>${process.env.SMTP_FROM_NAME || "DM Assistant"}</h2>
    <p>${subject}</p>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">
    You received this email because you are subscribed to ${fromName || "our"} marketing list.<br>
    To unsubscribe, reply with "unsubscribe" in the subject line.
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/email/create
const createCampaign = async (req, res) => {
  const { name, subject, body, recipients, customEmails, scheduleAt, template } = req.body;
  const uid = req.user.uid;

  if (!name || !subject) {
    return res.status(400).json({ message: "Name and subject are required" });
  }

  // Parse custom emails
  let parsedEmails = [];
  if (customEmails) {
    parsedEmails = customEmails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  try {
    const docRef = await db.collection("email_campaigns").add({
      userId:       uid,
      name,
      subject,
      body:         body        || "",
      recipients:   recipients  || "subscribers",
      customEmails: parsedEmails,
      scheduleAt:   scheduleAt  || null,
      template:     template    || "default",
      status:       "draft",
      sent:         0,
      opened:       0,
      clicked:      0,
      createdAt:    new Date(),
    });

    await db.collection("notifications").add({
      userId:    uid,
      type:      "email",
      title:     "Email Campaign Created",
      body:      `Campaign "${name}" is ready to send.`,
      read:      false,
      actionUrl: "/dashboard/campaigns",
      createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("Create email campaign error:", err.message);
    res.status(500).json({ message: "Failed to create campaign" });
  }
};

// GET /api/email/campaigns
const getCampaigns = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("email_campaigns")
      .where("userId", "==", uid)
      .get();

    const campaigns = snap.docs
      .map(doc => ({
        id:        doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt:    doc.data().sentAt?.toDate?.()?.toISOString()    || doc.data().sentAt || null,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, campaigns });
  } catch (err) {
    console.error("Get campaigns error:", err.message);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// DELETE /api/email/:id
const deleteCampaign = async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;
  try {
    const doc = await db.collection("email_campaigns").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(403).json({ message: "Campaign not found or access denied" });
    }
    await db.collection("email_campaigns").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete campaign error:", err.message);
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

// POST /api/email/:id/send  — REAL email sending via Nodemailer
const sendCampaign = async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;

  try {
    const docSnap = await db.collection("email_campaigns").doc(id).get();
    if (!docSnap.exists || docSnap.data().userId !== uid) {
      return res.status(403).json({ message: "Campaign not found or access denied" });
    }
    const campaign = docSnap.data();

    // ── Build recipient list ─────────────────────────────────────────────────
    let recipientList = [];

    if (campaign.customEmails && campaign.customEmails.length > 0) {
      // Use campaign-specific custom email list
      recipientList = campaign.customEmails.map(email => ({ email, name: "" }));
    } else {
      // Use subscribers collection
      const subSnap = await db.collection("subscribers")
        .where("userId", "==", uid)
        .where("status", "==", "active")
        .get();
      recipientList = subSnap.docs.map(d => ({
        email: d.data().email,
        name:  d.data().name || "",
      }));
    }

    if (recipientList.length === 0) {
      return res.status(400).json({
        message: "No recipients found. Add subscribers or enter custom emails in the campaign.",
      });
    }

    // ── Send via mailer (SendGrid or Gmail fallback) ─────────────────────────
    const sentLogsRef = db.collection("email_campaigns").doc(id).collection("sent_logs");
    const batch       = db.batch();
    let   sentCount   = 0;
    const errors      = [];

    for (const recipient of recipientList) {
      try {
        // Personalise {{name}} placeholder
        const personalBody = (campaign.body || "")
          .replace(/\{\{name\}\}/gi, recipient.name || "Valued Customer");

        await sendMail({
          to:      recipient.email,
          subject: campaign.subject,
          html:    buildHtml(campaign.subject, personalBody, process.env.SMTP_FROM_NAME),
          text:    personalBody.replace(/<[^>]+>/g, ""),
        });

        const logRef = sentLogsRef.doc();
        batch.set(logRef, {
          email:   recipient.email,
          name:    recipient.name || "",
          sentAt:  new Date(),
          status:  "sent",
          opened:  false,
          clicked: false,
        });
        sentCount++;
      } catch (mailErr) {
        console.error(`Failed to send to ${recipient.email}:`, mailErr.message);
        errors.push({ email: recipient.email, error: mailErr.message });
      }
    }

    await batch.commit();

    // Update campaign record
    await db.collection("email_campaigns").doc(id).update({
      status:  "sent",
      sentAt:  new Date(),
      sent:    sentCount,
    });

    // Notification
    await db.collection("notifications").add({
      userId:    uid,
      type:      "email",
      title:     "Campaign Sent!",
      body:      `"${campaign.name}" sent to ${sentCount} recipient${sentCount !== 1 ? "s" : ""}.`,
      read:      false,
      actionUrl: "/dashboard/campaigns",
      createdAt: new Date(),
    });

    res.json({
      success:    true,
      message:    `Campaign sent to ${sentCount} of ${recipientList.length} recipients.`,
      sentCount,
      errorCount: errors.length,
    });
  } catch (err) {
    console.error("Send campaign error:", err.message);
    res.status(500).json({ message: "Failed to send campaign" });
  }
};

// GET /api/email/:id/details  — campaign + sent logs
const getCampaignDetails = async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;
  try {
    const docSnap = await db.collection("email_campaigns").doc(id).get();
    if (!docSnap.exists || docSnap.data().userId !== uid) {
      return res.status(403).json({ message: "Campaign not found" });
    }

    const campaign = {
      id:     docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
      sentAt:    docSnap.data().sentAt?.toDate?.()?.toISOString()    || null,
    };

    // Sent logs subcollection
    const logsSnap = await db.collection("email_campaigns").doc(id)
      .collection("sent_logs")
      .orderBy("sentAt", "desc")
      .get();

    const logs = logsSnap.docs.map(d => ({
      id:    d.id,
      ...d.data(),
      sentAt: d.data().sentAt?.toDate?.()?.toISOString() || d.data().sentAt,
    }));

    res.json({ success: true, campaign, logs });
  } catch (err) {
    console.error("Get campaign details error:", err.message);
    res.status(500).json({ message: "Failed to fetch campaign details" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBSCRIBERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/email/subscribers
const getSubscribers = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("subscribers")
      .where("userId", "==", uid)
      .get();

    const subscribers = snap.docs
      .map(d => ({ id: d.id, ...d.data(), addedAt: d.data().addedAt?.toDate?.()?.toISOString() || d.data().addedAt }))
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.json({ success: true, subscribers });
  } catch (err) {
    console.error("Get subscribers error:", err.message);
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};

// POST /api/email/subscribers/add
const addSubscriber = async (req, res) => {
  const { email, name } = req.body;
  const uid = req.user.uid;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Valid email address is required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check for duplicate
    const existing = await db.collection("subscribers")
      .where("userId", "==", uid)
      .where("email", "==", cleanEmail)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ message: "This email is already subscribed" });
    }

    const ref = await db.collection("subscribers").add({
      userId:  uid,
      email:   cleanEmail,
      name:    name?.trim() || "",
      status:  "active",
      addedAt: new Date(),
    });

    res.json({ success: true, id: ref.id, email: cleanEmail });
  } catch (err) {
    console.error("Add subscriber error:", err.message);
    res.status(500).json({ message: "Failed to add subscriber" });
  }
};

// POST /api/email/subscribers/bulk  — paste comma/newline separated emails
const bulkImportSubscribers = async (req, res) => {
  const { emails } = req.body;   // raw string of emails
  const uid = req.user.uid;

  if (!emails) return res.status(400).json({ message: "No emails provided" });

  // Parse + validate
  const parsed = [...new Set(
    emails.split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  )];

  if (parsed.length === 0) {
    return res.status(400).json({ message: "No valid email addresses found" });
  }

  try {
    // Get existing to skip duplicates
    const existingSnap = await db.collection("subscribers")
      .where("userId", "==", uid)
      .get();
    const existingEmails = new Set(existingSnap.docs.map(d => d.data().email));

    const newEmails  = parsed.filter(e => !existingEmails.has(e));
    const batch      = db.batch();
    const now        = new Date();

    newEmails.forEach(email => {
      const ref = db.collection("subscribers").doc();
      batch.set(ref, { userId: uid, email, name: "", status: "active", addedAt: now });
    });

    await batch.commit();

    res.json({
      success:    true,
      added:      newEmails.length,
      skipped:    parsed.length - newEmails.length,
      message:    `Added ${newEmails.length} subscribers (${parsed.length - newEmails.length} duplicates skipped)`,
    });
  } catch (err) {
    console.error("Bulk import error:", err.message);
    res.status(500).json({ message: "Failed to import subscribers" });
  }
};

// DELETE /api/email/subscribers/:id
const deleteSubscriber = async (req, res) => {
  const { id } = req.params;
  const uid    = req.user.uid;
  try {
    const doc = await db.collection("subscribers").doc(id).get();
    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(403).json({ message: "Subscriber not found" });
    }
    await db.collection("subscribers").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete subscriber error:", err.message);
    res.status(500).json({ message: "Failed to delete subscriber" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AI GENERATE
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/email/generate-content
const generateEmailContent = async (req, res) => {
  const { product, audience, tone, type } = req.body;
  if (!product) return res.status(400).json({ message: "Product is required" });

  try {
    const model  = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `
You are a professional email marketing copywriter specialising in Sri Lankan businesses.
Write a ${type || "promotional"} email for the following:

Product/Service: ${product}
Target audience: ${audience || "general Sri Lankan audience"}
Tone: ${tone || "professional"}

Return ONLY a valid JSON object with exactly these fields:
{
  "subject":   "<compelling email subject line>",
  "preheader": "<short preview text, max 90 chars>",
  "greeting":  "<personalised opening greeting>",
  "body":      "<main email body, 2-3 paragraphs, plain text>",
  "cta":       "<call-to-action button text>",
  "signature": "<professional sign-off>"
}
Return ONLY valid JSON, no markdown.`.trim();

    const gemRes = await model.generateContent(prompt);
    let   text   = gemRes.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const content = JSON.parse(text);
    res.json({ success: true, content });
  } catch (err) {
    console.error("Generate email content error:", err.message);
    res.status(500).json({ message: "Failed to generate email content" });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  deleteCampaign,
  sendCampaign,
  getCampaignDetails,
  generateEmailContent,
  getSubscribers,
  addSubscriber,
  bulkImportSubscribers,
  deleteSubscriber,
};
