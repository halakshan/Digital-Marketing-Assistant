"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { METHODS } from "./paymentsData";

export default function PaymentMethods() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {METHODS.map(m => (
        <div
          key={m.name}
          style={{ background: C.card, border: `1px solid ${m.primary ? C.purple : C.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}
        >
          <div style={{ width: 48, height: 48, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {m.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</p>
              {m.primary && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.purpleGlow, border: `1px solid rgba(124,58,237,0.3)`, color: C.accent, fontWeight: 600 }}>
                  Primary
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.detail}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!m.primary && (
              <button style={{ background: "transparent", color: C.accent, border: `1px solid rgba(124,58,237,0.4)`, padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                Set Primary
              </button>
            )}
            <button style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add new method */}
      <button style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 14, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", color: C.muted, fontSize: 14, fontWeight: 600, fontFamily: "'Sora',sans-serif" }}>
        + Add Payment Method
      </button>
    </div>
  );
}