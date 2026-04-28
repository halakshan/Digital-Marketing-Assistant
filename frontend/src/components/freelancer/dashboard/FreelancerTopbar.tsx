"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { C } from "./dashboardData";

interface Props {
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

export default function FreelancerTopbar({ userName, userInitial, userPhoto }: Props) {
  const router = useRouter();
  const firstName = userName.split(" ")[0] || "there";
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
    <header style={{ height: 64, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 10, fontFamily: "'Sora',sans-serif" }}>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Dashboard</span>
        <span style={{ fontSize: 14, color: C.muted, marginLeft: 8 }}>
          {getGreeting()}, {firstName} 👋
        </span>
      </div>

      {/* Notification Bell */}
      <div
        onClick={() => router.push("/freelancer/notifications")}
        style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17, transition: "border-color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, background: "#ef4444", borderRadius: 9, fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: `2px solid ${C.surface}` }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Avatar → Profile */}
      <div
        onClick={() => router.push("/freelancer/profile")}
        style={{ cursor: "pointer", borderRadius: "50%", transition: "box-shadow 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.5)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        title="View Profile"
      >
        {userPhoto ? (
          <img src={userPhoto} alt={userName} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {userInitial}
          </div>
        )}
      </div>

    </header>
  );
}
