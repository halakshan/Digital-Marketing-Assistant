"use client";

import { C } from "../freelancer/dashboard/dashboardData";

interface Props {
  onClose: () => void;
}

export default function SystemBar({ onClose }: Props) {
  return (
    <div style={{ background: "linear-gradient(90deg,#1a0a3a,#0f172a)", borderBottom: `1px solid rgba(124,58,237,0.3)`, padding: "10px 28px", display: "flex", alignItems: "center", gap: 12, fontSize: 12.5 }}>
      <span>🚀</span>
      <p style={{ flex: 1, color: C.subtle }}>
        <strong style={{ color: C.accent }}>New feature:</strong>{" "}
        AI-powered proposal generator is now live — create winning proposals 3× faster.
      </p>
      <button style={{ fontSize: 11, fontWeight: 600, border: `1px solid rgba(124,58,237,0.4)`, color: C.accent, padding: "5px 12px", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
        Try Now
      </button>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14 }}>✕</button>
    </div>
  );
}