"use client";

import { C }         from "@/components/freelancer/dashboard/dashboardData";
import { PROPOSALS } from "./proposalData";

export default function ProposalStats() {
  const stats = [
    { label: "Total Sent", val: PROPOSALS.length,                                    color: C.accent   },
    { label: "Pending",    val: PROPOSALS.filter(p => p.status === "pending").length,  color: C.yellow   },
    { label: "Accepted",   val: PROPOSALS.filter(p => p.status === "accepted").length, color: C.green    },
    { label: "Rejected",   val: PROPOSALS.filter(p => p.status === "rejected").length, color: "#ef4444"  },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{s.label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>
            {s.val}
          </p>
        </div>
      ))}
    </div>
  );
}