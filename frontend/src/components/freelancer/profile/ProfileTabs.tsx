"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

type Tab = "portfolio" | "skills" | "reviews";

interface Props {
  active:   Tab;
  onChange: (tab: Tab) => void;
}

const TABS: Tab[] = ["portfolio", "skills", "reviews"];

export default function ProfileTabs({ active, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Sora',sans-serif", border: "none",
            background:      active === tab ? C.purple      : "transparent",
            color:           active === tab ? "#fff"        : C.subtle,
            transition:      "all 0.18s",
            textTransform:   "capitalize",
          }}
          onMouseEnter={e => { if (active !== tab) e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { if (active !== tab) e.currentTarget.style.color = C.subtle; }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}