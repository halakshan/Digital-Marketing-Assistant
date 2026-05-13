"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useState, useEffect } from "react";

const SIDEBAR_LINKS = [
  // ── Main ──
  { icon: "🏠", label: "Dashboard",        href: "/dashboard",                  group: "main"    },
  // ── Create ──
  { icon: "🤖", label: "AI Content",       href: "/dashboard/ai-content",       group: "create"  },
  { icon: "🎬", label: "Video Ads",        href: "/dashboard/video-ads",        group: "create"  },
  { icon: "🎨", label: "Post Design",      href: "/dashboard/post-design",      group: "create"  },
  // ── Web ──
  { icon: "🌐", label: "Web Design",       href: "/dashboard/web-design",       group: "web"     },
  // ── Marketing ──
  { icon: "📱", label: "Social Accounts",  href: "/dashboard/social-accounts",  group: "market"  },
  { icon: "📢", label: "Ad Campaigns",     href: "/dashboard/ad-campaigns",     group: "market"  },
  { icon: "📧", label: "Email Campaigns",  href: "/dashboard/campaigns",        group: "market"  },
  { icon: "📈", label: "SEO Analytics",    href: "/dashboard/seo",              group: "market"  },
  { icon: "📊", label: "Monthly Reports",  href: "/dashboard/reports",          group: "market"  },
  // ── Connect ──
  { icon: "👥", label: "Marketplace",      href: "/dashboard/marketplace",      group: "connect" },
  { icon: "💬", label: "Messages",         href: "/dashboard/messages",         group: "connect" },
  { icon: "🔔", label: "Notifications",    href: "/dashboard/notifications",    group: "connect" },
  // ── Account ──
  { icon: "⚡", label: "Upgrade Plan",      href: "/dashboard/upgrade",          group: "account" },
  { icon: "⚙️", label: "Settings",         href: "/dashboard/settings",         group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
  main:    "",
  create:  "Create",
  web:     "Web",
  market:  "Marketing",
  connect: "Connect",
  account: "Account",
};

interface SidebarProps {
  sidebarOpen:   boolean;
  activeLink:    string;
  setActiveLink: (label: string) => void;
  userName?:     string;
  userInitial?:  string;
  userPhoto?:    string;
  userPlan?:     string;
  isFreelancer?: boolean;
}

export default function Sidebar({
  sidebarOpen, activeLink, setActiveLink,
  userName    = "User",
  userInitial = "U",
  userPhoto   = "",
  userPlan    = "Free Plan",
  isFreelancer = false,
}: SidebarProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // Detect admin flag from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setIsAdmin(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setIsAdmin(snap.exists() && snap.data().isAdmin === true);
      } catch { setIsAdmin(false); }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-[#0d0d1a] border-r border-white/10 flex flex-col transition-all duration-300 h-screen sticky top-0 z-50`}>

      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">DM</div>
        {sidebarOpen && (
          <span className="font-bold text-base tracking-tight">
            DM <span className="text-violet-400">Assistant</span>
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {SIDEBAR_LINKS.map((l, i) => {
          const prevGroup = i > 0 ? SIDEBAR_LINKS[i - 1].group : null;
          const showLabel = sidebarOpen && l.group !== prevGroup && GROUP_LABELS[l.group];
          return (
            <div key={l.label}>
              {showLabel && (
                <p className="px-3 pt-3 pb-1 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  {GROUP_LABELS[l.group]}
                </p>
              )}
              <Link href={l.href} onClick={() => setActiveLink(l.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium mb-0.5 ${
                  activeLink === l.label
                    ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                <span className="text-base flex-shrink-0">{l.icon}</span>
                {sidebarOpen && <span>{l.label}</span>}
              </Link>
            </div>
          );
        })}

        {/* Freelancer Hub — only visible to registered freelancers */}
        {isFreelancer && (
          <>
            {sidebarOpen && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Freelancer</p>
              </div>
            )}
            <Link
              href="/freelancer"
              onClick={() => setActiveLink("Freelancer Hub")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                activeLink === "Freelancer Hub"
                  ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base flex-shrink-0">🧑‍💼</span>
              {sidebarOpen && (
                <span className="flex items-center gap-2">
                  Freelancer Hub
                  <span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                </span>
              )}
            </Link>
          </>
        )}

        {/* Admin Panel — only visible to admins */}
        {isAdmin && (
          <>
            {sidebarOpen && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest">Admin</p>
              </div>
            )}
            <Link
              href="/admin/withdrawals"
              onClick={() => setActiveLink("Withdrawals")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                activeLink === "Withdrawals"
                  ? "bg-gradient-to-r from-red-600/30 to-orange-600/20 text-white border border-red-500/30"
                  : "text-gray-400 hover:bg-red-500/5 hover:text-red-400"
              }`}
            >
              <span className="text-base flex-shrink-0">⚙️</span>
              {sidebarOpen && (
                <span className="flex items-center gap-2">
                  Withdrawals
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>
                </span>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* User Profile + Sign Out */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3">
          {userPhoto ? (
            <img src={userPhoto} alt={userName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
          )}
          {sidebarOpen && (
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold truncate">{userName}</div>
              <div className="text-xs text-gray-400 truncate">{userPlan}</div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 ${
            !sidebarOpen ? "justify-center" : ""
          }`}
        >
          <span className="text-base flex-shrink-0">🚪</span>
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
