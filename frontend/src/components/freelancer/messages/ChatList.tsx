"use client";

import { useState }    from "react";
import { C }           from "@/components/freelancer/dashboard/dashboardData";
import { CHATS }       from "./messagesData";
import ChatListItem    from "./ChatListItem";

interface Props {
  activeId: number;
  onSelect: (id: number) => void;
}

export default function ChatList({ activeId, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = CHATS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ width: 300, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

      {/* Header */}
      <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>Messages</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px" }}>
          <span>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", width: "100%" }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
            No chats found
          </div>
        )}
        {filtered.map(c => (
          <ChatListItem
            key={c.id}
            chat={c}
            isActive={activeId === c.id}
            onClick={onSelect}
          />
        ))}
      </div>

      {/* Total unread count */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.muted }}>
          {CHATS.filter(c => c.unread > 0).length} unread conversations
        </span>
        <span style={{ fontSize: 18, cursor: "pointer" }}>✏️</span>
      </div>
    </div>
  );
}