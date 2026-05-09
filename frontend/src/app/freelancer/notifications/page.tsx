"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg:          "#0d0f1a",
  surface:     "#111827",
  card:        "#1a2035",
  border:      "rgba(255,255,255,0.08)",
  text:        "#e2e8f0",
  muted:       "#64748b",
  subtle:      "#94a3b8",
  accent:      "#7c3aed",
  accent2:     "#3b82f6",
  purple:      "#7c3aed",
  purpleGlow:  "rgba(124,58,237,0.15)",
  green:       "#22c55e",
  yellow:      "#eab308",
  red:         "#ef4444",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType = "social" | "job" | "message" | "payment" | "system";

interface Notification {
  id:        string;
  userId:    string;
  type:      NotifType;
  title:     string;
  body:      string;
  read:      boolean;
  actionUrl?: string;
  createdAt: Timestamp | null;
}

type FilterOption = "All" | "Jobs" | "Messages" | "Payments" | "System";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<NotifType, string> = {
  social:  "🎉",
  job:     "💼",
  message: "💬",
  payment: "💰",
  system:  "⚙️",
};

function timeAgo(ts: Timestamp | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)      return `${diff}s ago`;
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  return ts.toDate().toLocaleDateString();
}

function dayLabel(ts: Timestamp | null): "Today" | "Yesterday" | "Earlier" {
  if (!ts) return "Earlier";
  const d    = ts.toDate();
  const now  = new Date();
  const diff = Math.floor((now.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
}

function groupNotifications(notifs: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
  notifs.forEach(n => {
    groups[dayLabel(n.createdAt)].push(n);
  });
  return groups;
}

function applyFilter(notifs: Notification[], filter: FilterOption): Notification[] {
  if (filter === "All")      return notifs;
  if (filter === "Jobs")     return notifs.filter(n => n.type === "job");
  if (filter === "Messages") return notifs.filter(n => n.type === "message");
  if (filter === "Payments") return notifs.filter(n => n.type === "payment");
  if (filter === "System")   return notifs.filter(n => n.type === "system");
  return notifs;
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({
  notif,
  onRead,
  onDelete,
}: {
  notif:    Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  function handleClick() {
    onRead(notif.id);
    if (notif.actionUrl) router.push(notif.actionUrl);
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        "relative",
        display:         "flex",
        alignItems:      "flex-start",
        gap:             14,
        padding:         "16px 18px",
        borderRadius:    12,
        background:      notif.read ? C.surface : "rgba(124,58,237,0.10)",
        border:          `1px solid ${notif.read ? C.border : "rgba(124,58,237,0.25)"}`,
        cursor:          "pointer",
        transition:      "all 0.18s",
        marginBottom:    10,
        boxShadow:       hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        transform:       hovered ? "translateY(-1px)" : "none",
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span style={{
          position:     "absolute",
          top:          12,
          right:        42,
          width:        8,
          height:       8,
          borderRadius: "50%",
          background:   C.purple,
          boxShadow:    `0 0 6px ${C.purple}`,
        }} />
      )}

      {/* Delete button */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
          style={{
            position:   "absolute",
            top:        10,
            right:      12,
            background: "rgba(239,68,68,0.12)",
            border:     "1px solid rgba(239,68,68,0.3)",
            color:      C.red,
            borderRadius: 6,
            width:      26,
            height:     26,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:     "pointer",
            fontSize:   14,
            lineHeight: 1,
            fontFamily: "'Sora',sans-serif",
          }}
        >
          ×
        </button>
      )}

      {/* Icon */}
      <div style={{
        width:        44,
        height:       44,
        borderRadius: 12,
        background:   notif.read ? "rgba(255,255,255,0.04)" : C.purpleGlow,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     22,
        flexShrink:   0,
      }}>
        {ICON_MAP[notif.type]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{
            fontSize:   14,
            fontWeight: notif.read ? 500 : 700,
            color:      C.text,
            overflow:   "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth:   "75%",
          }}>
            {notif.title}
          </span>
          <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 8 }}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p style={{
          fontSize:   13,
          color:      C.subtle,
          margin:     0,
          lineHeight: 1.5,
          overflow:   "hidden",
          display:    "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {notif.body}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { uid, authLoading } = useFreelancerUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter,        setFilter]        = useState<FilterOption>("All");
  const [loading,       setLoading]       = useState(true);

  // ── Firestore real-time listener ──────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !uid) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Notification, "id">),
      }));
      setNotifications(docs);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [uid, authLoading]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.read) return;
    await updateDoc(doc(db, "notifications", id), { read: true });
  }, [notifications]);

  const deleteNotif = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  }, [notifications]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered    = applyFilter(notifications, filter);
  const groups      = groupNotifications(filtered);

  const FILTERS: FilterOption[] = ["All", "Jobs", "Messages", "Payments", "System"];

  const EMPTY_MESSAGES: Record<FilterOption, string> = {
    All:      "No notifications yet — check back later! 🌙",
    Jobs:     "No job notifications yet 💼",
    Messages: "No message notifications yet 💬",
    Payments: "No payment notifications yet 💰",
    System:   "No system notifications yet ⚙️",
  };

  if (authLoading) {
    return (
      <div style={{ padding: 28, color: C.text, fontFamily: "'Sora',sans-serif" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          style={{
            background:  "transparent",
            color:       unreadCount === 0 ? C.muted : C.accent,
            border:      `1px solid ${unreadCount === 0 ? C.border : "rgba(124,58,237,0.4)"}`,
            padding:     "9px 18px",
            borderRadius: 10,
            fontSize:    13,
            fontWeight:  600,
            cursor:      unreadCount === 0 ? "default" : "pointer",
            fontFamily:  "'Sora',sans-serif",
            transition:  "all 0.18s",
          }}
          onMouseEnter={e => { if (unreadCount > 0) e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          Mark All as Read
        </button>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background:   filter === f ? C.purple : "transparent",
              color:        filter === f ? "#fff" : C.subtle,
              border:       `1px solid ${filter === f ? C.purple : C.border}`,
              padding:      "7px 16px",
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   filter === f ? 600 : 500,
              cursor:       "pointer",
              fontFamily:   "'Sora',sans-serif",
              transition:   "all 0.18s",
            }}
            onMouseEnter={e => { if (filter !== f) e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; }}
            onMouseLeave={e => { if (filter !== f) e.currentTarget.style.borderColor = C.border; }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontSize: 14 }}>
          Loading notifications…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign:   "center",
          padding:     "80px 0",
          color:       C.muted,
          fontSize:    15,
          background:  C.surface,
          borderRadius: 16,
          border:      `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {filter === "All" ? "🔔" : filter === "Jobs" ? "💼" : filter === "Messages" ? "💬" : filter === "Payments" ? "💰" : "⚙️"}
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>{EMPTY_MESSAGES[filter]}</p>
        </div>
      ) : (
        <>
          {(["Today", "Yesterday", "Earlier"] as const).map(label => {
            const items = groups[label];
            if (!items || items.length === 0) return null;
            return (
              <div key={label} style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize:     11,
                  fontWeight:   700,
                  color:        C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                  paddingLeft:  4,
                }}>
                  {label}
                </div>
                {items.map(n => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
