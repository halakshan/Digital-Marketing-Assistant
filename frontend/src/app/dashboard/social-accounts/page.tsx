"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

// ── Platform definitions — inline SVG real brand icons ───────────────────────
const PLATFORMS = [
  {
    key:"Facebook", label:"Facebook", desc:"Connect with friends & pages", url:"https://www.facebook.com/",
    bg:"#1877F2", glow:"group-hover:shadow-[0_0_30px_rgba(24,119,242,0.4)]", ring:"group-hover:ring-[#1877F2]/50",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key:"Instagram", label:"Instagram", desc:"Photos, reels & stories", url:"https://www.instagram.com/",
    bg:"radial-gradient(circle at 30% 110%, #fdf497, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    glow:"group-hover:shadow-[0_0_30px_rgba(225,48,108,0.4)]", ring:"group-hover:ring-[#E1306C]/50",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    key:"LinkedIn", label:"LinkedIn", desc:"Professional network & jobs", url:"https://www.linkedin.com/feed/",
    bg:"#0A66C2", glow:"group-hover:shadow-[0_0_30px_rgba(10,102,194,0.4)]", ring:"group-hover:ring-[#0A66C2]/50",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    key:"YouTube", label:"YouTube", desc:"Videos, shorts & live streams", url:"https://www.youtube.com/",
    bg:"#FF0000", glow:"group-hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]", ring:"group-hover:ring-[#FF0000]/50",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    key:"TikTok", label:"TikTok", desc:"Short videos & trends", url:"https://www.tiktok.com/",
    bg:"#010101", glow:"group-hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]", ring:"group-hover:ring-white/30",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
  {
    key:"X", label:"X (Twitter)", desc:"News, trends & conversations", url:"https://x.com/home",
    bg:"#000000", glow:"group-hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]", ring:"group-hover:ring-white/30",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key:"Pinterest", label:"Pinterest", desc:"Ideas, boards & inspiration", url:"https://www.pinterest.com/",
    bg:"#E60023", glow:"group-hover:shadow-[0_0_30px_rgba(230,0,35,0.4)]", ring:"group-hover:ring-[#E60023]/50",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
  {
    key:"Snapchat", label:"Snapchat", desc:"Snaps, stories & messages", url:"https://web.snapchat.com/",
    bg:"#FFFC00", glow:"group-hover:shadow-[0_0_30px_rgba(255,252,0,0.3)]", ring:"group-hover:ring-[#FFFC00]/40",
    Icon:()=>(
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#000000">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.024.358-.029.53.216.081.436-.01.662-.1.287-.12.582-.24.9-.187.206.04.986.23.988 1.032.002.786-.697 1.07-1.163 1.253-.094.036-.197.078-.307.13.07.166.177.351.332.608.267.441.65 1.046 1.261 1.854.386.516 1.148.84 1.964 1.061.143.04.516.162.477.613-.04.444-.56.697-.84.73a5.445 5.445 0 01-.56.037c-.302 0-.553-.027-.743-.05-.58-.063-.843.018-1.064.11-.45.178-.748.626-.861.987-.067.21-.175.548-.547.548-.165 0-.334-.065-.494-.127a5.65 5.65 0 00-2.045-.438c-.47 0-.927.06-1.362.176a5.68 5.68 0 00-2.127 1.143c-.124.107-.277.175-.443.175-.356 0-.547-.301-.607-.51-.114-.36-.41-.808-.862-.987-.22-.09-.483-.173-1.062-.11-.19.023-.441.05-.744.05a5.16 5.16 0 01-.56-.037c-.28-.033-.8-.286-.84-.73-.04-.451.334-.572.477-.613.816-.22 1.578-.545 1.964-1.06.611-.81.994-1.415 1.26-1.855.155-.256.263-.44.334-.607-.11-.052-.214-.094-.307-.13-.466-.183-1.165-.467-1.163-1.253.002-.802.782-.992.988-1.032.318-.053.614.067.9.187.226.09.446.181.662.1l-.029-.53c-.104-1.628-.23-3.654.299-4.847C7.86 1.07 11.216.793 12.206.793z"/>
      </svg>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const LS_KEY = "dma_social_last_visited";

function getLastVisited(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function setLastVisited(key: string) {
  const data = getLastVisited();
  data[key] = Date.now();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SocialAccountsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("Social Accounts");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,    setUserName]    = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userPhoto,   setUserPhoto]   = useState("");
  const [userPlan,    setUserPlan]    = useState("Free Plan");
  const [lastVisited, setLastVisitedState] = useState<Record<string, number>>({});
  const [filter,      setFilter]      = useState("");

  // Load last-visited from localStorage on mount
  useEffect(() => { setLastVisitedState(getLastVisited()); }, []);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d    = snap.data();
          const name = d.fullName || user.displayName || "User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
          setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
        } else {
          const name = user.displayName || "User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
        }
      } catch { /**/ }
    });
    return () => unsub();
  }, [router]);

  const handleOpen = (p: typeof PLATFORMS[0]) => {
    setLastVisited(p.key);
    setLastVisitedState(getLastVisited());
    window.open(p.url, "_blank", "noopener,noreferrer");
  };

  // Filtered list
  const filtered = PLATFORMS.filter(p =>
    p.label.toLowerCase().includes(filter.toLowerCase()) ||
    p.desc.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan} isFreelancer={isFreelancer}/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}/>

        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Social Media Accounts</h1>
              <p className="text-sm text-gray-400 mt-1">
                Click a platform to open it — you'll be logged in automatically after the first time
              </p>
            </div>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Search platforms…"
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25 w-48 transition-all"
              />
            </div>
          </div>

          {/* ── All Platforms Grid ── */}
          <div className="space-y-3">
            {!filter && <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">All Platforms</h2>}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">No platforms match "<span className="text-white">{filter}</span>"</p>
                <button onClick={() => setFilter("")} className="mt-3 text-xs text-violet-400 hover:text-violet-300">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {filtered.map(p => {
                  const visited = lastVisited[p.key];
                  return (
                    <button
                      key={p.key}
                      onClick={() => handleOpen(p)}
                      className={`group relative flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 text-left ${p.glow} ${p.ring} ring-1 ring-transparent`}
                    >

                      {/* Visited dot */}
                      {visited && (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                        </div>
                      )}

                      {/* Real brand icon — inline SVG on brand color */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:-translate-y-0.5 flex-shrink-0"
                        style={{ background: p.bg }}
                      >
                        <p.Icon/>
                      </div>

                      {/* Info */}
                      <div className="text-center w-full">
                        <div className="text-sm font-bold leading-tight">{p.label}</div>
                      </div>

                      {/* Open icon — appears on hover */}
                      <div className="absolute bottom-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>


        </main>
      </div>
    </div>
  );
}
