"use client";

import { C }                   from "@/components/freelancer/dashboard/dashboardData";
import { Notif, TYPE_COLOR }   from "./notificationsData";

interface Props {
  notif:    Notif;
  isLast:   boolean;
  onRead:   (id: number) => void;
}

export default function NotifItem({ notif, isLast, onRead }: Props) {
  const color = TYPE_COLOR[notif.type] || C.accent;

  return (
    <div
      onClick={() => onRead(notif.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px 20px",
        borderBottom: isLast ? "none" : `1px solid ${C.border}`,
        cursor: "pointer",
        background:   notif.read ? "transparent" : "rgba(124,58,237,0.04)",
        transition:   "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = notif.read ? "rgba(255,255,255,0.03)" : "rgba(124,58,237,0.07)")}
      onMouseLeave={e => (e.currentTarget.style.background = notif.read ? "transparent" : "rgba(124,58,237,0.04)")}
    >
      {/* Type icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${color}18`,
        border:     `1px solid ${color}33`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>
        {notif.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <p style={{
            fontSize: 13.5,
            fontWeight: notif.read ? 500 : 700,
            color:      notif.read ? C.subtle : C.text,
          }}>
            {notif.title}
          </p>
          <p style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 12 }}>
            {notif.time}
          </p>
        </div>
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
          {notif.desc}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <span style={{ width: 8, height: 8, background: C.purple, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}