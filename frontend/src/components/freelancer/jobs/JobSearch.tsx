"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

interface Props {
  value:    string;
  onChange: (val: string) => void;
}

export default function JobSearch({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 240 }}>
      <span>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search jobs or clients..."
        style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", width: "100%" }}
      />
    </div>
  );
}