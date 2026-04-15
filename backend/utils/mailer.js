/**
 * mailer.js — Central email utility
 * Auto-picks SendGrid (preferred) or Gmail SMTP (fallback)
 *
 * Usage:
 *   const { sendMail } = require("../utils/mailer");
 *   await sendMail({ to, subject, html, text });
 */

const nodemailer = require("nodemailer");

const hasSendGrid =
  process.env.SENDGRID_API_KEY &&
  !process.env.SENDGRID_API_KEY.includes("YOUR_SENDGRID");

// ── SendGrid sender ─────────────────────────────────────────────────────────
async function sendViaSendGrid({ to, subject, html, text }) {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@dmassistant.lk",
      name:  process.env.SENDGRID_FROM_NAME  || "DM Assistant",
    },
    subject,
    html,
    text: text || subject,
  });
}

// ── Gmail SMTP sender ───────────────────────────────────────────────────────
async function sendViaGmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("No email provider configured. Add SENDGRID_API_KEY or SMTP credentials to .env");
  }
  const transporter = nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const from = `${process.env.SMTP_FROM_NAME || "DM Assistant"} <${process.env.SMTP_USER}>`;
  await transporter.sendMail({ from, to, subject, html, text: text || subject });
}

// ── Main export — picks provider automatically ─────────────────────────────
async function sendMail({ to, subject, html, text }) {
  if (hasSendGrid) {
    await sendViaSendGrid({ to, subject, html, text });
  } else {
    await sendViaGmail({ to, subject, html, text });
  }
}

// ── Pre-built templates ────────────────────────────────────────────────────

function emailVerificationTemplate(name, verifyUrl) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13162a;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.2);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">✉️ Verify Your Email</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">DM Assistant</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 12px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Welcome to DM Assistant! Please verify your email address to activate your account and start creating AI-powered marketing content.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;">
          ✅ Verify My Email
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 40px;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© 2026 DM Assistant · support@dmassistant.lk</p>
    </div>
  </div>
</body>
</html>`;
}

function welcomeTemplate(name, role) {
  const isFreelancer = role === "freelancer";
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13162a;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.2);">
    <div style="background:linear-gradient(135deg,#059669,#0284c7);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🎉 Welcome to DM Assistant!</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 12px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">
        ${isFreelancer
          ? "Your freelancer account is ready! Complete your profile to start receiving hire requests from businesses across Sri Lanka."
          : "Your account is ready! Start creating AI-powered content, running campaigns, and growing your business today."
        }
      </p>
      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="color:#a78bfa;font-size:13px;font-weight:700;margin:0 0 12px;">🚀 Get started:</p>
        ${isFreelancer ? `
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Complete your freelancer profile</p>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Add your skills and services</p>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Set your hourly/project rate</p>
        ` : `
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Generate your first AI content</p>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Set up your social accounts</p>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0;">✓ Browse the freelancer marketplace</p>
        `}
      </div>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}${isFreelancer ? "/freelancer" : "/dashboard"}"
          style="display:inline-block;background:linear-gradient(135deg,#059669,#0284c7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;">
          Go to Dashboard →
        </a>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 40px;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© 2026 DM Assistant · support@dmassistant.lk</p>
    </div>
  </div>
</body>
</html>`;
}

function passwordResetTemplate(name, resetUrl) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13162a;border-radius:16px;overflow:hidden;border:1px solid rgba(239,68,68,0.2);">
    <div style="background:linear-gradient(135deg,#dc2626,#9333ea);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🔐 Reset Your Password</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 12px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
        We received a request to reset your DM Assistant password. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#9333ea);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;">
          Reset My Password →
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 40px;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">© 2026 DM Assistant · support@dmassistant.lk</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  sendMail,
  emailVerificationTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  hasSendGrid,
};
