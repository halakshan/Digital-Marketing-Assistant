"use client";

import { C }     from "@/components/freelancer/dashboard/dashboardData";
import { STATS } from "./profileData";

export default function ProfileHero() {
  return (
    <div style={{ position: "relative", background: "linear-gradient(135deg,#1a1040,#0f172a,#130d2e)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 24, overflow: "hidden" }}>

      {/* Glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.12),transparent 60%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative" }}>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 700, color: "#fff", border: `3px solid ${C.purple}`, boxShadow: "0 0 28px rgba(124,58,237,0.45)" }}>
            K
          </div>
          <span style={{ position: "absolute", bottom: 3, right: 3, width: 16, height: 16, background: C.green, borderRadius: "50%", border: `2px solid ${C.bg}` }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Kasun Bandara</p>
          <p style={{ fontSize: 14, color: C.accent, marginBottom: 10 }}>🎨 Graphic Designer & Video Editor • Colombo, Sri Lanka</p>
          <p style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6, maxWidth: 500 }}>
            Creative designer specializing in brand identities, social media content, and video ads for Sri Lankan businesses. Fluent in Sinhala, Tamil, and English content.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Edit button */}
        <button
          style={{ background: C.purple, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.purple;  e.currentTarget.style.transform = "translateY(0)";    }}
        >
          ✏️ Edit Profile
        </button>
      </div>
    </div>
  );
}