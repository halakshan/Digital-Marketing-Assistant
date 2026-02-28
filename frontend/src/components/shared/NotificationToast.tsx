"use client";

import { Toast, C } from "../freelancer/dashboard/dashboardData";

interface Props {
  toasts: Toast[];
  systemBarVisible: boolean;
  onClose: (id: number) => void;
}

export default function NotificationToast({ toasts, systemBarVisible, onClose }: Props) {
  return (
    <div style={{ position: "fixed", top: systemBarVisible ? 80 : 16, right: 20, zIndex: 50, display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
      {toasts.map(t => {
        const leftColor = { green: C.green, yellow: C.yellow, purple: C.purple }[t.type];
        return (
          <div key={t.id} className="toast-enter" style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${leftColor}`, borderRadius: 12, padding: "13px 16px", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.sub}</p>
              <p style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginTop: 6, cursor: "pointer" }}>{t.action} →</p>
            </div>
            <button onClick={() => onClose(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14, flexShrink: 0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}