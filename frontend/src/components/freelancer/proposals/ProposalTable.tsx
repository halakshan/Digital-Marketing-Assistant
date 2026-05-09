"use client";

import { C }                    from "@/components/freelancer/dashboard/dashboardData";
import { Proposal, STATUS_MAP } from "./proposalData";

interface Props {
  proposals: Proposal[];
}

export default function ProposalTable({ proposals }: Props) {
  if (proposals.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 10 }}>📨</p>
        <p style={{ fontSize: 14, color: C.muted }}>No proposals found</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>

      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        <span>Job Title</span>
        <span>Client</span>
        <span>Job Budget</span>
        <span>My Bid</span>
        <span>Sent</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      {proposals.map((p, i) => {
        const st = STATUS_MAP[p.status as keyof typeof STATUS_MAP];
        return (
          <div
            key={p.id}
            style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < proposals.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{p.title}</span>
            </div>

            {/* Client */}
            <span style={{ fontSize: 13, color: C.muted }}>{p.client}</span>

            {/* Budget */}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>
              {p.budget}
            </span>

            {/* Bid */}
            <span style={{ fontSize: 13, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>
              {p.bid}
            </span>

            {/* Sent */}
            <span style={{ fontSize: 12, color: C.muted }}>{p.sent}</span>

            {/* Status */}
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, display: "inline-block", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}