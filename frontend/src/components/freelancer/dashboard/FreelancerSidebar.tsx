"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { C } from "./dashboardData";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

interface Props {
  userName:    string;
  userInitial: string;
  userPhoto:   string;
  category:    string;
}

export default function FreelancerSidebar({ userName, userInitial, userPhoto, category }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { uid }  = useFreelancerUser();

  // Real-time unread counts
  const [unreadNotifs,   setUnreadNotifs]   = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests,setPendingRequests]= useState(0);

  useEffect(() => {
    if (!uid) return;

    // Unread notifications
    const nq = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      where("read",   "==", false)
    );
    const errIgnore = (e: any) => { if (e.code !== "permission-denied") console.error(e); };
    const un1 = onSnapshot(nq, s => setUnreadNotifs(s.size), errIgnore);

    // Unread messages (conversations where unreadFreelancer > 0)
    const mq = query(
      collection(db, "conversations"),
      where("freelancerUid", "==", uid)
    );
    const un2 = onSnapshot(mq, s => {
      const count = s.docs.reduce((acc, d) => acc + (d.data().unreadFreelancer || 0), 0);
      setUnreadMessages(count);
    }, errIgnore);

    // Pending hire requests
    const rq = query(
      collection(db, "hire_requests"),
      where("freelancerUid", "==", uid),
      where("status", "==", "pending")
    );
    const un3 = onSnapshot(rq, s => setPendingRequests(s.size), errIgnore);

    return () => { un1(); un2(); un3(); };
  }, [uid]);

  const navGroups = [
    {
      label: "Main",
      items: [
        { icon: "🏠", label: "Dashboard",   path: "/freelancer"          },
        { icon: "👤", label: "My Profile",  path: "/freelancer/profile"  },
        { icon: "💼", label: "My Services", path: "/freelancer/services" },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { icon: "📋", label: "Active Projects", path: "/freelancer/projects"  },
        { icon: "📨", label: "Hire Requests",   path: "/freelancer/proposals", badge: pendingRequests },
      ],
    },
    {
      label: "Communication",
      items: [
        { icon: "💬", label: "Messages",      path: "/freelancer/messages",      badge: unreadMessages },
        { icon: "🔔", label: "Notifications", path: "/freelancer/notifications", badge: unreadNotifs  },
      ],
    },
    {
      label: "Finance",
      items: [
        { icon: "💰", label: "Earnings",        path: "/freelancer/earnings"         },
        { icon: "💳", label: "Payments",        path: "/freelancer/payments"         },
        { icon: "🏦", label: "Payout Settings", path: "/freelancer/payout-settings"  },
      ],
    },
    {
      label: "Account",
      items: [
        { icon: "⚙️", label: "Settings", path: "/freelancer/settings" },
        { icon: "🚪", label: "Logout",   path: "/login"               },
      ],
    },
  ];

  return (
    <>
      <style>{`
        .sidebar-item:hover { background: ${C.purpleGlow}; color: ${C.text} !important; }
        .sidebar-item.active { background: ${C.purpleGlow}; color: ${C.accent} !important; }
        .sidebar-item.active::before {
          content: '';
          position: absolute;
          left: -16px; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 20px;
          background: ${C.purple};
          border-radius: 0 3px 3px 0;
        }
      `}</style>

      <aside style={{ width: 240, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 16px", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20, fontFamily: "'Sora',sans-serif" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 28px", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: C.purple, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>DM</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>DM <span style={{ color: C.accent }}>Assistant</span></span>
        </div>

        {/* Nav Groups */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.2px", color: C.muted, padding: "0 8px", marginBottom: 6 }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const isActive = pathname === item.path;
                const badge    = (item as any).badge;
                return (
                  <div key={item.path}
                    className={`sidebar-item${isActive ? " active" : ""}`}
                    onClick={() => router.push(item.path)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 500, color: isActive ? C.accent : C.subtle, position: "relative", transition: "all 0.18s", marginBottom: 2 }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{ background: C.purple, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, fontFamily: "'JetBrains Mono',monospace", minWidth: 18, textAlign: "center" }}>
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* User chip */}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: C.card, cursor: "pointer" }}>
            {userPhoto ? (
              <img src={userPhoto} alt={userName} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {userInitial}
              </div>
            )}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName || "Freelancer"}</p>
              <p style={{ fontSize: 11, color: C.accent }}>🎨 {category || "Freelancer"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
