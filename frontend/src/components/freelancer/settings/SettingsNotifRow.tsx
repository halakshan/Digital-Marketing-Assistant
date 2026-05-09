"use client";

import { C }              from "@/components/freelancer/dashboard/dashboardData";
import SettingsToggle     from "./SettingsToggle";

interface Props {
  label:    string;
  sub:      string;
  val:      boolean;
  onToggle: () => void;
}

export default function SettingsNotifRow({ label, sub, val, onToggle }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{label}</p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</p>
      </div>
      <SettingsToggle val={val} onChange={onToggle} />
    </div>
  );
}