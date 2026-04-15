"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken, User } from "firebase/auth";
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
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "campaign" | "social" | "ai" | "system" | "hire" | "message" | "payment";

interface FirestoreNotification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: Timestamp): string {
  const now = Date.now();
  const diffMs = now - ts.toMillis();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) === 1 ? "" : "s"} ago`;
}

function getGroup(ts: Timestamp): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const d = ts.toDate();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";
  return "Earlier";
}

const TYPE_ICON: Record<string, string> = {
  ai:       "🤖",
  campaign: "📣",
  email:    "📧",
  social:   "🎉",
  hire:     "🎉",
  message:  "💬",
  payment:  "💰",
  system:   "⚙️",
  seo:      "📈",
};

const TYPE_COLOR: Record<string, string> = {
  ai:       "from-violet-500/20 to-indigo-500/10  border-violet-500/30",
  campaign: "from-orange-500/20 to-amber-500/10   border-orange-500/30",
  email:    "from-amber-500/20  to-yellow-500/10  border-amber-500/30",
  social:   "from-green-500/20  to-emerald-500/10 border-green-500/30",
  hire:     "from-green-500/20  to-emerald-500/10 border-green-500/30",
  message:  "from-blue-500/20   to-cyan-500/10    border-blue-500/30",
  payment:  "from-yellow-500/20 to-amber-500/10   border-yellow-500/30",
  system:   "from-gray-500/20   to-slate-500/10   border-gray-500/30",
  seo:      "from-teal-500/20   to-green-500/10   border-teal-500/30",
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "All",           value: "all"      },
  { label: "🤖 AI",         value: "ai"       },
  { label: "📧 Email",      value: "email"    },
  { label: "📣 Campaigns",  value: "campaign" },
  { label: "💬 Messages",   value: "message"  },
  { label: "💰 Payments",   value: "payment"  },
  { label: "⚙️ System",     value: "system"   },
];

// ─── Notification Card ────────────────────────────────────────────────────────

interface CardProps {
  notif: FirestoreNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string) => void;
}

function NotificationCard({ notif, onMarkRead, onDelete, onNavigate }: CardProps) {
  const handleClick = () => {
    if (!notif.read) onMarkRead(notif.id);
    if (notif.actionUrl) onNavigate(notif.actionUrl);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
        ${notif.read
          ? "bg-[#0d0d1a] border-white/10 hover:border-white/20"
          : "bg-[#12122a] border-violet-500/25 hover:border-violet-500/40"
        }`}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLOR[notif.type] || TYPE_COLOR.system}`}>
        {TYPE_ICON[notif.type] || "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${notif.read ? "text-gray-200" : "text-white"}`}>
            {notif.title}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{notif.body}</p>
        <p className="text-xs text-gray-600 mt-1.5">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
        className="absolute top-3 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 text-sm leading-none"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isFreelancer = useIsFreelancer(currentUser?.uid);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName,    setUserName]    = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userPhoto,   setUserPhoto]   = useState("");

  // UI state
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [activeLink,     setActiveLink]     = useState("Notifications");
  const [activeFilter,   setActiveFilter]   = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Data state
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [dataLoading,   setDataLoading]   = useState(true);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCurrentUser(user);
      setAuthLoading(false);

      const name    = user.displayName ?? user.email ?? "User";
      const initial = name.charAt(0).toUpperCase();
      setUserName(name);
      setUserInitial(initial);
      setUserPhoto(user.photoURL ?? "");

      // Prefetch token so it's warm
      await getIdToken(user);
    });
    return () => unsub();
  }, [router]);

  // ── Firestore real-time listener ───────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snapshot => {
      const docs: FirestoreNotification[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<FirestoreNotification, "id">),
      }));
      setNotifications(docs);
      setDataLoading(false);
    }, _err => {
      setDataLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
  }, []);

  const handleNavigate = useCallback((url: string) => {
    router.push(url);
  }, [router]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    const matchType   = activeFilter === "all" || n.type === activeFilter;
    const matchUnread = !showUnreadOnly || !n.read;
    return matchType && matchUnread;
  });

  const groups: Record<"Today" | "Yesterday" | "Earlier", FirestoreNotification[]> = {
    Today:     filtered.filter(n => getGroup(n.createdAt) === "Today"),
    Yesterday: filtered.filter(n => getGroup(n.createdAt) === "Yesterday"),
    Earlier:   filtered.filter(n => getGroup(n.createdAt) === "Earlier"),
  };

  // ── Loading / auth gates ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        userName={userName}
        userInitial={userInitial}
        userPhoto={userPhoto}
        userPlan="Free Plan"
        isFreelancer={isFreelancer}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Custom header (Topbar doesn't have notification title) ── */}
        <header className="bg-[#0d0d1a]/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ☰
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                🔔 Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400">Stay updated on all your activity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all font-semibold"
              >
                ✓ Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-semibold ${
                showUnreadOnly
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {showUnreadOnly ? "🔴 Unread only" : "Show unread only"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map(tab => {
              const count = tab.value === "all"
                ? notifications.length
                : notifications.filter(n => n.type === tab.value).length;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    activeFilter === tab.value
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeFilter === tab.value
                        ? "bg-violet-500/30 text-violet-200"
                        : "bg-white/10 text-gray-400"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading spinner */}
          {dataLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Notification groups */}
          {!dataLoading && (
            <>
              {(["Today", "Yesterday", "Earlier"] as const).map(group => {
                const items = groups[group];
                if (items.length === 0) return null;
                return (
                  <section key={group}>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      {group}
                    </h2>
                    <div className="space-y-2">
                      {items.map(notif => (
                        <NotificationCard
                          key={notif.id}
                          notif={notif}
                          onMarkRead={markRead}
                          onDelete={deleteNotification}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔔</div>
                  <div className="text-lg font-bold mb-2">All caught up!</div>
                  <div className="text-sm text-gray-400">No notifications to show right now.</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
