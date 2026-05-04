"use client";

import { C }      from "@/components/freelancer/dashboard/dashboardData";
import { SKILLS } from "./profileData";

export default function SkillsEditor() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Skills & Expertise</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {SKILLS.map(s => (
          <span
            key={s}
            style={{ fontSize: 13, padding: "8px 16px", borderRadius: 20, background: C.purpleGlow, border: "1px solid rgba(124,58,237,0.3)", color: C.accent, fontWeight: 500, cursor: "default" }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}