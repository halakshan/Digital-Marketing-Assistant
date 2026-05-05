"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";

const ACTIONS = [
  { icon: "💬", label: "Message Client"      },
  { icon: "📎", label: "Upload Deliverable"  },
  { icon: "✅", label: "Mark as Complete"    },
];

export default function ProjectActions() {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Actions</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACTIONS.map(a => (
          <button
            key={a.label}
            style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 500, color: C.subtle, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s", textAlign: "left" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
          >
            <span>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}