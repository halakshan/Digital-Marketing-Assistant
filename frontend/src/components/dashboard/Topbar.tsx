"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

interface TopbarProps {
  onToggleSidebar: () => void;
  userName:    string;
  userInitial: string;
  userPhoto:   string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function Topbar({ onToggleSidebar, userName = "", userInitial = "U", userPhoto = "" }: TopbarProps) {
  const firstName = (userName || "").split(" ")[0] || "there";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snapUnsub = onSnapshot(q, (snap) => {
        setUnreadCount(snap.size);
      }, (err) => {
        if (err.code !== "permission-denied") console.error("notifications:", err);
      });
      return () => snapUnsub();
    });
    return () => authUnsub();
  }, []);

  return (
    <header className="bg-[#0d0d1a]/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-gray-400 hover:text-white transition-colors text-xl">☰</button>
        <div>
          <h1 className="text-lg font-bold">{getGreeting()}, {firstName} 👋</h1>
          <p className="text-xs text-gray-400">{formatDate()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/notifications" className="relative">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 flex items-center justify-center text-gray-300 hover:text-white transition-all">
            🔔
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/dashboard/settings">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-9 h-9 rounded-xl object-cover cursor-pointer" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm cursor-pointer">
              {userInitial}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
