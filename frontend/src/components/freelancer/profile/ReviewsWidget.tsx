"use client";

import { C }       from "@/components/freelancer/dashboard/dashboardData";
import { REVIEWS } from "./profileData";

export default function ReviewsWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {REVIEWS.map((r, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: C.yellow }}>{"★".repeat(r.stars)}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{r.date}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6 }}>{r.text}</p>
        </div>
      ))}
    </div>
  );
}