"use client";

import { C }                    from "@/components/freelancer/dashboard/dashboardData";
import { TABS, TAB_ICONS }      from "./settingsData";

interface Props {
  active:   string;
  onChange: (tab: string) => void;
}

export default function SettingsSidebar({ active, onChange }: Props) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 8, height: "fit-content" }}>
      {TABS.map(t => (
        <div
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 500,
            cursor: "pointer", marginBottom: 2, transition: "all 0.18s",
            color:       active === t ? C.accent     : C.subtle,
            background:  active === t ? C.purpleGlow : "transparent",
            borderLeft:  active === t ? `3px solid ${C.purple}` : "3px solid transparent",
          }}
          onMouseEnter={e => {
            if (active !== t) {
              e.currentTarget.style.background = "rgba(124,58,237,0.1)";
              e.currentTarget.style.color = C.accent;
            }
          }}
          onMouseLeave={e => {
            if (active !== t) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.subtle;
            }
          }}
        >
          {TAB_ICONS[t]} {t}
        </div>
      ))}
    </div>
  );
}