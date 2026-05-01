"use client";

import { C } from "./dashboardData";

const actions = [
  { icon: "✍️", label: "New Proposal" },
  { icon: "💼", label: "Add Service"  },
  { icon: "📊", label: "View Reports" },
  { icon: "💳", label: "Withdraw"     },
];

export default function QuickActions() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Quick Actions</p>
      </div>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {actions.map(a => (
          <button key={a.label} className="qa" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.18s", fontFamily: "'Sora',sans-serif" }}>
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.subtle }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}