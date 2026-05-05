"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

interface Props {
  milestones: string[];
}

export default function MilestoneTracker({ milestones }: Props) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Milestones</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {milestones.map((m, i) => {
          const isDone    = m.includes("✅");
          const isActive  = m.includes("🔄");
          const color     = isDone ? C.green : isActive ? C.yellow : C.muted;
          const dotColor  = isDone ? C.green : isActive ? C.yellow : C.border;

          return (
            <div key={i} style={{ fontSize: 13, color, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
              {m}
            </div>
          );
        })}
      </div>
    </div>
  );
}