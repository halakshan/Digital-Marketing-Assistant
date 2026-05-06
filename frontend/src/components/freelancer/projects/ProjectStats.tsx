"use client";

import { C }             from "@/components/freelancer/dashboard/dashboardData";
import { SUMMARY_STATS } from "./projectData";

const colorMap: Record<string, string> = {
  accent: C.accent,
  green:  C.green,
  yellow: C.yellow,
  blue:   C.blue,
};

export default function ProjectStats() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
      {SUMMARY_STATS.map(s => (
        <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{s.label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: colorMap[s.colorKey], fontFamily: "'JetBrains Mono',monospace" }}>
            {s.val}
          </p>
        </div>
      ))}
    </div>
  );
}