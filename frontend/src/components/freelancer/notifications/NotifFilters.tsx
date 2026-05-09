"use client";

import { C }       from "@/components/freelancer/dashboard/dashboardData";
import { FILTERS } from "./notificationsData";

interface Props {
  active:   string;
  onChange: (f: string) => void;
}

export default function NotifFilters({ active, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          style={{
            padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Sora',sans-serif",
            border:      `1px solid ${C.border}`,
            background:  active === f ? C.purpleGlow : C.card,
            color:       active === f ? C.accent     : C.subtle,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => {
            if (active !== f) {
              e.currentTarget.style.background = "rgba(124,58,237,0.18)";
              e.currentTarget.style.color = C.accent;
            }
          }}
          onMouseLeave={e => {
            if (active !== f) {
              e.currentTarget.style.background = C.card;
              e.currentTarget.style.color = C.subtle;
            }
          }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}