"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

// ── Ad Platform definitions — inline SVG real brand icons ────────────────────
const AD_PLATFORMS = [
  {
    key: "MetaAds", label: "Meta Ads Manager", desc: "Facebook & Instagram ad campaigns",
    url: "https://adsmanager.facebook.com/",
    bg: "#1877F2",
    glow: "group-hover:shadow-[0_0_30px_rgba(24,119,242,0.4)]", ring: "group-hover:ring-[#1877F2]/50",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: "GoogleAds", label: "Google Ads", desc: "Search, display & YouTube ads",
    url: "https://ads.google.com/",
    bg: "#ffffff",
    glow: "group-hover:shadow-[0_0_30px_rgba(66,133,244,0.35)]", ring: "group-hover:ring-[#4285F4]/50",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    key: "TikTokAds", label: "TikTok Ads Manager", desc: "Short video & in-feed ads",
    url: "https://ads.tiktok.com/",
    bg: "#010101",
    glow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]", ring: "group-hover:ring-white/30",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
  {
    key: "LinkedInAds", label: "LinkedIn Campaign Manager", desc: "B2B & professional audience ads",
    url: "https://www.linkedin.com/campaignmanager/",
    bg: "#0A66C2",
    glow: "group-hover:shadow-[0_0_30px_rgba(10,102,194,0.4)]", ring: "group-hover:ring-[#0A66C2]/50",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    key: "SnapchatAds", label: "Snapchat Ads Manager", desc: "Snap & story ad campaigns",
    url: "https://ads.snapchat.com/",
    bg: "#FFFC00",
    glow: "group-hover:shadow-[0_0_30px_rgba(255,252,0,0.3)]", ring: "group-hover:ring-[#FFFC00]/40",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#000000">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.024.358-.029.53.216.081.436-.01.662-.1.287-.12.582-.24.9-.187.206.04.986.23.988 1.032.002.786-.697 1.07-1.163 1.253-.094.036-.197.078-.307.13.07.166.177.351.332.608.267.441.65 1.046 1.261 1.854.386.516 1.148.84 1.964 1.061.143.04.516.162.477.613-.04.444-.56.697-.84.73a5.445 5.445 0 01-.56.037c-.302 0-.553-.027-.743-.05-.58-.063-.843.018-1.064.11-.45.178-.748.626-.861.987-.067.21-.175.548-.547.548-.165 0-.334-.065-.494-.127a5.65 5.65 0 00-2.045-.438c-.47 0-.927.06-1.362.176a5.68 5.68 0 00-2.127 1.143c-.124.107-.277.175-.443.175-.356 0-.547-.301-.607-.51-.114-.36-.41-.808-.862-.987-.22-.09-.483-.173-1.062-.11-.19.023-.441.05-.744.05a5.16 5.16 0 01-.56-.037c-.28-.033-.8-.286-.84-.73-.04-.451.334-.572.477-.613.816-.22 1.578-.545 1.964-1.06.611-.81.994-1.415 1.26-1.855.155-.256.263-.44.334-.607-.11-.052-.214-.094-.307-.13-.466-.183-1.165-.467-1.163-1.253.002-.802.782-.992.988-1.032.318-.053.614.067.9.187.226.09.446.181.662.1l-.029-.53c-.104-1.628-.23-3.654.299-4.847C7.86 1.07 11.216.793 12.206.793z"/>
      </svg>
    ),
  },
  {
    key: "PinterestAds", label: "Pinterest Ads", desc: "Promoted pins & shopping ads",
    url: "https://ads.pinterest.com/",
    bg: "#E60023",
    glow: "group-hover:shadow-[0_0_30px_rgba(230,0,35,0.35)]", ring: "group-hover:ring-[#E60023]/50",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
  {
    key: "TwitterAds", label: "X (Twitter) Ads", desc: "Promoted tweets & trend takeovers",
    url: "https://ads.twitter.com/",
    bg: "#000000",
    glow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]", ring: "group-hover:ring-white/30",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: "YouTubeAds", label: "YouTube Ads", desc: "Video & display ads on YouTube",
    url: "https://ads.google.com/intl/en_us/home/campaigns/youtube-ads/",
    bg: "#FF0000",
    glow: "group-hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]", ring: "group-hover:ring-[#FF0000]/50",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const LS_KEY = "dma_ads_last_visited";
function getLastVisited(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function setLastVisited(key: string) {
  const data = getLastVisited(); data[key] = Date.now();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdCampaignsPage() {
  const router = useRouter();
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [activeLink,       setActiveLink]       = useState("Ad Campaigns");
  const [firebaseUser,     setFirebaseUser]     = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,         setUserName]         = useState("");
  const [userInitial,      setUserInitial]      = useState("U");
  const [userPhoto,        setUserPhoto]        = useState("");
  const [userPlan,         setUserPlan]         = useState("Free Plan");
  const [lastVisited,      setLastVisitedState] = useState<Record<string, number>>({});
  const [filter,           setFilter]           = useState("");

  useEffect(() => { setLastVisitedState(getLastVisited()); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
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

  const handleOpen = (p: (typeof AD_PLATFORMS)[0]) => {
    setLastVisited(p.key);
    setLastVisitedState(getLastVisited());
    window.open(p.url, "_blank", "noopener,noreferrer");
  };

  const filtered = AD_PLATFORMS.filter(p =>
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

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">📢 Ad Campaign Platforms</h1>
              <p className="text-sm text-gray-400 mt-1">
                Click a platform to open its ads manager — manage your campaigns directly
              </p>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
                placeholder="Search platforms…"
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25 w-48 transition-all"/>
            </div>
          </div>

          {/* Grid */}
          <div className="space-y-3">
            {!filter && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">All Ad Platforms</h2>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">No platforms match "<span className="text-white">{filter}</span>"</p>
                <button onClick={() => setFilter("")} className="mt-3 text-xs text-violet-400 hover:text-violet-300">Clear search</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => {
                  const visited = lastVisited[p.key];
                  return (
                    <button key={p.key} onClick={() => handleOpen(p)}
                      className={`group relative flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ${p.glow} ${p.ring} ring-1 ring-transparent`}>

                      {visited && (
                        <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-green-400 block"/>
                      )}

                      {/* Brand icon: real official SVG on brand color */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:-translate-y-0.5 flex-shrink-0"
                        style={{ backgroundColor: p.bg }}
                      >
                        <p.Icon/>
                      </div>

                      <div className="text-center w-full">
                        <div className="text-sm font-bold leading-tight">{p.label}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-snug">{p.desc}</div>
                      </div>

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