"use client";

import { useState } from "react";
import { C } from "@/components/freelancer/dashboard/dashboardData";

interface Message {
  from: "me" | "them";
  text: string;
  time: string;
}

interface Props {
  name: string;
  avatar: string;
  gradient: string;
  online: boolean;
  initialMessages?: Message[];
}

export default function ChatWindow({ name, avatar, gradient, online, initialMessages = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput]       = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages(p => [...p, { from: "me", text: input, time: "Just now" }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Sora',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; }
        .send-btn:hover { background:#6d28d9 !important; }
        input::placeholder { color:${C.muted}; }
      `}</style>

      {/* Chat header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.surface, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {avatar}
          </div>
          {online && (
            <span style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, background: C.green, borderRadius: "50%", border: `2px solid ${C.surface}` }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</p>
          <p style={{ fontSize: 12, color: online ? C.green : C.muted }}>{online ? "Online" : "Offline"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["📞", "📹", "⋯"].map(icon => (
            <div key={icon} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15 }}>
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: C.bg }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>💬</p>
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "65%" }}>
              <div style={{
                background:    m.from === "me" ? C.purple : C.card,
                color:         m.from === "me" ? "#fff"   : C.text,
                padding:       "10px 14px",
                borderRadius:  m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize:      13,
                lineHeight:    1.5,
                border:        m.from === "me" ? "none" : `1px solid ${C.border}`,
              }}>
                {m.text}
              </div>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4, textAlign: m.from === "me" ? "right" : "left" }}>
                {m.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center", background: C.surface, flexShrink: 0 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif" }}
          />
          <span style={{ cursor: "pointer", fontSize: 18 }}>📎</span>
          <span style={{ cursor: "pointer", fontSize: 18 }}>😊</span>
        </div>
        <button
          className="send-btn"
          onClick={send}
          style={{ background: C.purple, border: "none", color: "#fff", width: 44, height: 44, borderRadius: 12, fontSize: 18, cursor: "pointer", transition: "background 0.18s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}