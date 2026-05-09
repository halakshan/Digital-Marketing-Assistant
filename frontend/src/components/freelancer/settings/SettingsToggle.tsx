"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

interface Props {
  val:      boolean;
  onChange: () => void;
}

export default function SettingsToggle({ val, onChange }: Props) {
  return (
    <div
      onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 12, background: val ? C.purple : C.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 3, left: val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}