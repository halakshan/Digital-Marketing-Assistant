"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { TRANSACTIONS } from "./earningsData";

export default function EarningsTable() {
  const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>

      {/* Title */}
      <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Transaction History</p>
      </div>

      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr 1fr", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        <span>Project</span>
        <span>Client</span>
        <span>Amount</span>
        <span>Date</span>
        <span>Status</span>
      </div>

      {/* Data rows */}
      {TRANSACTIONS.map((t, i) => (
        <div
          key={t.id}
          style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr 1fr", padding: "14px 20px", borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{t.title}</span>
          </div>
          <span style={{ fontSize: 13, color: C.muted }}>{t.client}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>
            {fmt(t.amount)}
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>{t.date}</span>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, display: "inline-block",
            background: t.status === "paid" ? "rgba(34,197,94,0.12)"  : "rgba(234,179,8,0.12)",
            color:      t.status === "paid" ? C.green                  : C.yellow,
            border:     `1px solid ${t.status === "paid" ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"}`,
          }}>
            {t.status === "paid" ? "✅ Paid" : "⏳ Pending"}
          </span>
        </div>
      ))}
    </div>
  );
}