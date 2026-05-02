"use client";

import { C }         from "@/components/freelancer/dashboard/dashboardData";
import { PORTFOLIO } from "./profileData";

export default function PortfolioGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      {PORTFOLIO.map(p => (
        <div
          key={p.id}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.22s" }}
          onMouseEnter={e => {
            e.currentTarget.style.transform   = "translateY(-3px)";
            e.currentTarget.style.boxShadow   = "0 10px 30px rgba(0,0,0,0.4)";
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform   = "translateY(0)";
            e.currentTarget.style.boxShadow   = "none";
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          <div style={{ width: 50, height: 50, borderRadius: 12, background: `${p.color}22`, border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>
            {p.icon}
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{p.title}</p>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${p.color}18`, border: `1px solid ${p.color}33`, color: p.color, fontWeight: 500 }}>
            {p.tag}
          </span>
        </div>
      ))}
    </div>
  );
}