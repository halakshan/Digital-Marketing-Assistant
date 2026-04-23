"use client";

import { C }    from "@/components/freelancer/dashboard/dashboardData";
import { Chat } from "./messagesData";

interface Props {
  chat:     Chat;
  isActive: boolean;
  onClick:  (id: number) => void;
}

export default function ChatListItem({ chat, isActive, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(chat.id)}
      style={{
        display: "flex", gap: 10, alignItems: "center",
        padding: "12px 16px", cursor: "pointer",
        background:  isActive ? C.purpleGlow   : "transparent",
        borderLeft:  isActive ? `3px solid ${C.purple}` : "3px solid transparent",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: chat.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          {chat.avatar}
        </div>
        {chat.online && (
          <span style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, background: C.green, borderRadius: "50%", border: `2px solid ${C.surface}` }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{chat.name}</p>
          <p style={{ fontSize: 11, color: C.muted }}>{chat.time}</p>
        </div>
        <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {chat.last}
        </p>
      </div>

      {/* Unread badge */}
      {chat.unread > 0 && (
        <span style={{ background: C.purple, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
          {chat.unread}
        </span>
      )}
    </div>
  );
}