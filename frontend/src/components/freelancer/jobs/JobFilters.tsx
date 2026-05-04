"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { CATEGORIES } from "./jobsData";

interface Props {
  active:   string;
  onChange: (cat: string) => void;
}

export default function JobFilters({ active, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Sora',sans-serif",
            border: `1px solid ${C.border}`,
            background: active === cat ? C.purpleGlow : C.card,
            color:      active === cat ? C.accent     : C.subtle,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => {
            if (active !== cat) {
              e.currentTarget.style.background = "rgba(124,58,237,0.18)";
              e.currentTarget.style.color = C.accent;
            }
          }}
          onMouseLeave={e => {
            if (active !== cat) {
              e.currentTarget.style.background = C.card;
              e.currentTarget.style.color = C.subtle;
            }
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}