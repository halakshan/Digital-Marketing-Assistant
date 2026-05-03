"use client";

import { C }       from "@/components/freelancer/dashboard/dashboardData";
import { Service } from "./servicesData";

interface Props {
  service:      Service;
  onToggle:     (id: number) => void;
  onDelete:     (id: number) => void;
}

export default function ServiceCard({ service: s, onToggle, onDelete }: Props) {
  const isActive = s.status === "active";

  return (
    <div
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, transition: "all 0.22s", cursor: "default" }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = "translateY(-2px)";
        e.currentTarget.style.boxShadow   = "0 10px 28px rgba(0,0,0,0.35)";
        e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "none";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {s.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.title}</p>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
              background: isActive ? "rgba(34,197,94,0.12)"   : "rgba(100,116,139,0.12)",
              color:      isActive ? C.green                  : C.muted,
              border:     `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)"}`,
            }}>
              {isActive ? "● Active" : "⏸ Paused"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 20, padding: "12px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted }}>Price</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>{s.price}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: C.muted }}>Delivery</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.delivery}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: C.muted }}>Orders</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.blue }}>{s.orders}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: C.muted }}>Rating</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.yellow }}>{s.rating > 0 ? `${s.rating} ⭐` : "—"}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px", fontSize: 12, fontWeight: 600, color: C.subtle, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onToggle(s.id)}
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px", fontSize: 12, fontWeight: 600, color: isActive ? C.yellow : C.green, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
        >
          {isActive ? "⏸ Pause" : "▶ Activate"}
        </button>
        <button
          onClick={() => onDelete(s.id)}
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px", fontSize: 12, fontWeight: 600, color: "#ef4444", cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}