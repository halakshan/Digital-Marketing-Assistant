"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

interface Notif {
  id:    string;
  icon:  string;
  msg:   string;
  time:  string;
  color: string;
  read:  boolean;
}

function timeAgo(date: any): string {
  if (!date) return "";
  const now  = new Date();
  const then = date.toDate ? date.toDate() : new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60)        return `${diff}s`;
  if (diff < 3600)      return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function typeColor(type: string) {
  if (type === "ai")         return "text-violet-400";
  if (type === "message")    return "text-blue-400";
  if (type === "campaign")   return "text-cyan-400";
  if (type === "payment")    return "text-yellow-400";
  if (type === "seo")        return "text-green-400";
  return "text-gray-400";
}

function typeIcon(type: string) {
  if (type === "ai")         return "🤖";
  if (type === "message")    return "💬";
  if (type === "campaign")   return "📧";
  if (type === "payment")    return "💳";
  if (type === "seo")        return "📈";
  if (type === "system")     return "⚙️";
  return "🔔";
}

export default function NotificationsWidget() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDocs(
          query(collection(db, "notifications"),
            where("userId", "==", user.uid)
          )
        );
        const items: Notif[] = snap.docs
          .map(doc => {
            const d = doc.data();
            return {
              id:    doc.id,
              icon:  typeIcon(d.type),
              msg:   d.body || d.title || "New notification",
              time:  timeAgo(d.createdAt),
              color: typeColor(d.type),
              read:  d.read || false,
              _ts:   d.createdAt?.toMillis?.() || 0,
            };
          })
          .sort((a, b) => b._ts - a._ts)
          .slice(0, 4)
          .map(({ _ts, ...rest }) => rest) as Notif[];
        setNotifs(items);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {unreadCount}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-6 h-6 rounded bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2 bg-white/10 rounded w-full" />
                <div className="h-2 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🔔</div>
          <p className="text-xs">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id}
              className={`flex items-start gap-3 p-3 hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer ${n.read ? "bg-white/5" : "bg-violet-500/5 border border-violet-500/10"}`}>
              <span className={`text-lg flex-shrink-0 ${n.color}`}>{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-300 leading-relaxed">{n.msg}</div>
                <div className="text-xs text-gray-500 mt-1">{n.time} ago</div>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/dashboard/notifications"
        className="block w-full mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors text-center">
        View all notifications →
      </Link>
    </div>
  );
}