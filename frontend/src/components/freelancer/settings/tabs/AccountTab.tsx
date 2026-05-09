"use client";

import { C }          from "@/components/freelancer/dashboard/dashboardData";
import SettingsField  from "../SettingsField";

export default function AccountTab() {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Account Security</p>

      <SettingsField label="Current Password" value="" onChange={() => {}} placeholder="Enter current password" />
      <SettingsField label="New Password"     value="" onChange={() => {}} placeholder="Enter new password"     />
      <SettingsField label="Confirm Password" value="" onChange={() => {}} placeholder="Re-enter new password"  />

      {/* 2FA */}
      <div style={{ padding: 16, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 12, marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.blue, marginBottom: 4 }}>🔐 Two-Factor Authentication</p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Add an extra layer of security to your account</p>
        <button style={{ background: C.blue, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
          Enable 2FA
        </button>
      </div>

      {/* Danger zone */}
      <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>⚠️ Danger Zone</p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Permanently delete your account and all data</p>
        <button
          style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}