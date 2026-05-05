"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { BARS } from "./earningsData";

const MAX = Math.max(...BARS.map(b => b.val));

export default function EarningsChart() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>
        Monthly Earnings (LKR thousands)
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
        {BARS.map(b => (
          <div key={b.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
            <p style={{ fontSize: 11, color: C.accent, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
              {b.val}k
            </p>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div
                style={{
                  width: "100%",
                  height: `${(b.val / MAX) * 100}%`,
                  borderRadius: "6px 6px 0 0",
                  background: `linear-gradient(to top,${C.purple},${C.accent})`,
                  opacity: b.month === "Mar" ? 1 : 0.55,
                  transition: "opacity 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = b.month === "Mar" ? "1" : "0.55")}
              />
            </div>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
              {b.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}