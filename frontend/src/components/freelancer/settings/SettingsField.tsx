"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

interface Props {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  type?:       string;
  placeholder?: string;
}

export default function SettingsField({ label, value, onChange, type = "input", placeholder = "" }: Props) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </p>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none", resize: "vertical" }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none" }}
        />
      )}
    </div>
  );
}