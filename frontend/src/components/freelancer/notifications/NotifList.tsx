"use client";

import { C }        from "@/components/freelancer/dashboard/dashboardData";
import { Notif }    from "./notificationsData";
import NotifItem    from "./NotifItem";

interface Props {
  notifs:  Notif[];
  onRead:  (id: number) => void;
}

export default function NotifList({ notifs, onRead }: Props) {
  if (notifs.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 60, textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 10 }}>🔔</p>
        <p style={{ fontSize: 14, color: C.muted }}>No notifications found</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      {notifs.map((n, i) => (
        <NotifItem
          key={n.id}
          notif={n}
          isLast={i === notifs.length - 1}
          onRead={onRead}
        />
      ))}
    </div>
  );
}