"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { PAYMENTS } from "./paymentsData";

const statusStyle = (status: string) => ({
  completed:  { bg: "rgba(34,197,94,0.12)",  color: C.green,  border: "rgba(34,197,94,0.3)",  label: "✅ Completed"  },
  pending:    { bg: "rgba(234,179,8,0.12)",  color: C.yellow, border: "rgba(234,179,8,0.3)",  label: "⏳ Pending"    },
  processing: { bg: "rgba(59,130,246,0.12)", color: C.blue,   border: "rgba(59,130,246,0.3)", label: "🔄 Processing" },
}[status] || { bg: "", color: C.muted, border: "", label: status });

export default function PaymentsTable() {
  const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>

      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1.2fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        <span>Description</span><span>Client</span><span>Amount</span><span>Date</span><span>Method</span><span>Status</span>
      </div>

      {/* Rows */}
      {PAYMENTS.map((p, i) => {
        const st = statusStyle(p.status);
        return (
          <div
            key={p.id}
            style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1.2fr 1fr 1fr", padding: "14px 20px", borderBottom: i < PAYMENTS.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.title}</span>
            </div>
            <span style={{ fontSize: 13, color: C.muted }}>{p.client}</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: p.type === "withdraw" ? "#ef4444" : C.green }}>
              {p.type === "withdraw" ? "−" : "+"}{fmt(p.amount)}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>{p.date}</span>
            <span style={{ fontSize: 12, color: C.subtle }}>{p.method}</span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, display: "inline-block", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}