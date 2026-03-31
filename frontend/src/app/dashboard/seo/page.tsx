"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface CategoryScores { onPage: number; technical: number; content: number; backlinks: number; userExp: number }
interface Metrics { pageSpeed: number; mobileScore: number; backlinks: number; indexedPages: number; domainAge: string; httpsEnabled: boolean; hasSitemap: boolean; hasRobots: boolean }
interface Issue { type: "error"|"warning"|"info"; category: string; title: string; description: string; fix: string; impact: number }
interface Keyword { word: string; density: number; volume: string; difficulty: string; status: "good"|"low"|"high"|"missing" }
interface RoadItem { priority: number; action: string; category: string; impact: number; effort: "Easy"|"Medium"|"Hard"; done: boolean }
interface Competitor { domain: string; score: number }
interface SEOResult {
  score: number; url: string; title: string; metaDescription: string;
  categoryScores: CategoryScores; metrics: Metrics;
  issues: Issue[]; keywords: Keyword[]; roadTo100: RoadItem[];
  recommendations: string[]; strengths: string[]; competitors: Competitor[];
}
interface HistoryItem { id: string; url: string; score: number; keywords: string; createdAt: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 80 ? { stroke:"#22c55e", ring:"ring-green-500/40",  text:"text-green-400",  bg:"bg-green-500/20",  label:"Excellent" }
: s >= 60 ? { stroke:"#3b82f6", ring:"ring-blue-500/40",   text:"text-blue-400",   bg:"bg-blue-500/20",   label:"Good"      }
: s >= 40 ? { stroke:"#eab308", ring:"ring-yellow-500/40", text:"text-yellow-400", bg:"bg-yellow-500/20", label:"Fair"      }
:           { stroke:"#ef4444", ring:"ring-red-500/40",    text:"text-red-400",    bg:"bg-red-500/20",    label:"Poor"      };

const effortColor = (e: string) =>
  e === "Easy" ? "text-green-400 bg-green-500/10 border-green-500/30"
: e === "Hard" ? "text-red-400 bg-red-500/10 border-red-500/30"
:                "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";

const ISSUE_STYLE: Record<string, string> = {
  error:   "border-red-500/40 bg-red-500/5",
  warning: "border-yellow-500/40 bg-yellow-500/5",
  info:    "border-blue-500/40 bg-blue-500/5",
};
const ISSUE_ICON: Record<string, string> = { error:"❌", warning:"⚠️", info:"ℹ️" };

const KW_BADGE: Record<string, string> = {
  good:    "bg-green-500/20 text-green-400 border-green-500/30",
  low:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  missing: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── Big Score Gauge ───────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const { stroke, text, label } = scoreColor(score);
  const r = 70, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#ffffff08" strokeWidth="14"/>
          <circle cx="80" cy="80" r={r} fill="none" stroke={stroke} strokeWidth="14"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black ${text}`}>{score}</span>
          <span className="text-xs text-gray-500 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`text-base font-bold ${text}`}>{label}</span>
      <span className="text-xs text-gray-500">Overall SEO Score</span>
    </div>
  );
}

// ── Category bar ─────────────────────────────────────────────────────────────
function CatBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const { stroke, text } = scoreColor(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1.5"><span>{icon}</span>{label}</span>
        <span className={`font-bold ${text}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width:`${score}%`, background: stroke }}/>
      </div>
    </div>
  );
}

// ── Mini score badge ──────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const { text, bg } = scoreColor(score);
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>{score}</span>;
}

// ── Analyzing skeleton ────────────────────────────────────────────────────────
function AnalyzingSkeleton() {
  const steps = [
    { icon:"🔍", label:"Fetching URL data...",          done: true  },
    { icon:"⚙️", label:"Scanning technical factors...", done: true  },
    { icon:"📝", label:"Analyzing on-page SEO...",      done: true  },
    { icon:"🔗", label:"Estimating backlinks...",       done: false },
    { icon:"🤖", label:"Generating AI insights...",     done: false },
  ];
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
      <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"/>
      <div className="space-y-3 w-full max-w-xs">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 text-sm transition-all ${s.done ? "text-gray-400" : "text-white animate-pulse"}`}>
            <span>{s.icon}</span>
            <span>{s.label}</span>
            {s.done && <span className="ml-auto text-green-400">✓</span>}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">AI-powered analysis may take 10–20 seconds…</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SEOPage() {
  const router = useRouter();

  // Auth
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,     setUserName]     = useState("");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeLink,   setActiveLink]   = useState("SEO Analytics");

  // SEO state
  const [urlInput,   setUrlInput]   = useState("");
  const [kwInput,    setKwInput]    = useState("");
  const [analyzing,  setAnalyzing]  = useState(false);
  const [result,     setResult]     = useState<SEOResult | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [history,    setHistory]    = useState<HistoryItem[]>([]);
  const [activeTab,  setActiveTab]  = useState<"overview"|"issues"|"keywords"|"road"|"history">("overview");
  const [roadItems,  setRoadItems]  = useState<RoadItem[]>([]);
  const [issueFilter, setIssueFilter] = useState<"all"|"error"|"warning"|"info">("all");

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
          setUserPhoto(user.photoURL || "");
        }
      } catch { /**/ }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => { if (firebaseUser) fetchHistory(); }, [firebaseUser]);

  const fetchHistory = async () => {
    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/seo/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setHistory(data.history);
    } catch { /**/ }
  };

  const handleAnalyze = async () => {
    if (!urlInput.trim()) { setErrorMsg("Please enter a website URL"); return; }
    let url = urlInput.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    setErrorMsg(""); setAnalyzing(true); setResult(null); setRoadItems([]);

    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/seo/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, keywords: kwInput.trim() }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.message || `Error ${res.status}`); }
      const data = await res.json();
      if (!data.result) throw new Error("No result from server");
      setResult(data.result);
      setRoadItems((data.result.roadTo100 || []).map((r: RoadItem) => ({ ...r, done: false })));
      setActiveTab("overview");
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleRoadItem = (i: number) => {
    setRoadItems(prev => prev.map((r, idx) => idx === i ? { ...r, done: !r.done } : r));
  };

  const completedScore = result
    ? result.score + roadItems.filter(r => r.done).reduce((s, r) => s + (r.impact || 0), 0)
    : 0;

  const filteredIssues = result?.issues?.filter(iss => issueFilter === "all" || iss.type === issueFilter) ?? [];

  const TABS = [
    { key: "overview",  label: "Overview",      icon: "📊" },
    { key: "issues",    label: `Issues ${result ? `(${result.issues?.length ?? 0})` : ""}`,   icon: "🔎" },
    { key: "keywords",  label: "Keywords",      icon: "🔑" },
    { key: "road",      label: "Road to 100%",  icon: "🚀" },
    { key: "history",   label: "History",       icon: "🕒" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan} isFreelancer={isFreelancer}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}/>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">📈 SEO Analysis</h1>
              <p className="text-sm text-gray-400 mt-1">AI-powered website audit — find issues and get a clear path to 100%</p>
            </div>
          </div>

          {/* ── URL Input Card ─────────────────────────────────────────── */}
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌐</span>
              <h2 className="font-semibold text-gray-200">Analyze a Website</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">https://</span>
                <input type="text" value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                  placeholder="yourwebsite.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"/>
              </div>
              <input type="text" value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                placeholder="Target keywords (optional)"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"/>
              <button onClick={handleAnalyze} disabled={analyzing}
                className="px-7 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-violet-500/20">
                {analyzing ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/>Analyzing…</> : <>🔍 Analyze SEO</>}
              </button>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span>❌</span>{errorMsg}
              </div>
            )}

            {/* Quick examples */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600">Try:</span>
              {["google.com","github.com","shopify.com"].map(ex => (
                <button key={ex} onClick={() => setUrlInput(ex)}
                  className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded-lg transition-all border border-violet-500/20">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* ── Analyzing skeleton ─────────────────────────────────────── */}
          {analyzing && <AnalyzingSkeleton />}

          {/* ── Results ───────────────────────────────────────────────── */}
          {result && !analyzing && (
            <div className="space-y-5">

              {/* Score hero */}
              <div className="bg-gradient-to-br from-[#0d0d1a] to-[#11112a] border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                  {/* Gauge */}
                  <div className="flex justify-center">
                    <ScoreGauge score={result.score ?? 0} />
                  </div>

                  {/* Category bars */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Score Breakdown</h3>
                    <CatBar label="On-Page SEO"    score={result.categoryScores?.onPage    ?? 0} icon="📝"/>
                    <CatBar label="Technical SEO"  score={result.categoryScores?.technical ?? 0} icon="⚙️"/>
                    <CatBar label="Content Quality" score={result.categoryScores?.content  ?? 0} icon="✍️"/>
                    <CatBar label="Backlinks"       score={result.categoryScores?.backlinks ?? 0} icon="🔗"/>
                    <CatBar label="User Experience" score={result.categoryScores?.userExp   ?? 0} icon="👤"/>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon:"⚡", label:"Page Speed",    val: result.metrics?.pageSpeed   ?? "—", unit:"/100" },
                      { icon:"📱", label:"Mobile Score",  val: result.metrics?.mobileScore ?? "—", unit:"/100" },
                      { icon:"🔗", label:"Backlinks",     val: (result.metrics?.backlinks ?? 0).toLocaleString(), unit:"" },
                      { icon:"📄", label:"Indexed Pages", val: (result.metrics?.indexedPages ?? 0).toLocaleString(), unit:"" },
                    ].map(m => (
                      <div key={m.label} className="bg-white/5 rounded-xl p-3">
                        <div className="text-lg mb-1">{m.icon}</div>
                        <div className="text-lg font-extrabold text-white">{m.val}<span className="text-xs text-gray-500 ml-0.5 font-normal">{m.unit}</span></div>
                        <div className="text-xs text-gray-500">{m.label}</div>
                      </div>
                    ))}
                    {/* Badges */}
                    <div className="col-span-2 flex flex-wrap gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${result.metrics?.httpsEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {result.metrics?.httpsEnabled ? "✓" : "✗"} HTTPS
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${result.metrics?.hasSitemap ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {result.metrics?.hasSitemap ? "✓" : "✗"} Sitemap
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${result.metrics?.hasRobots ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {result.metrics?.hasRobots ? "✓" : "✗"} robots.txt
                      </span>
                      {result.metrics?.domainAge && (
                        <span className="text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 bg-blue-500/10 text-blue-400 border-blue-500/30">
                          🕐 {result.metrics.domainAge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Page title & meta */}
                {result.title && (
                  <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-gray-500 w-24 pt-0.5 flex-shrink-0">Page Title</span>
                      <span className="text-sm text-blue-400 font-medium">{result.title}</span>
                    </div>
                    {result.metaDescription && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-500 w-24 pt-0.5 flex-shrink-0">Meta Desc</span>
                        <span className="text-xs text-gray-400">{result.metaDescription}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === t.key ? "bg-violet-600 text-white shadow" : "text-gray-400 hover:text-white"
                    }`}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>

              {/* ── Overview tab ── */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Strengths */}
                  {result.strengths?.length > 0 && (
                    <div className="bg-[#0d0d1a] border border-green-500/20 rounded-2xl p-5 space-y-3">
                      <h3 className="font-semibold text-gray-200 flex items-center gap-2"><span>✅</span> What's Working</h3>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top recommendations */}
                  {result.recommendations?.length > 0 && (
                    <div className="bg-[#0d0d1a] border border-violet-500/20 rounded-2xl p-5 space-y-3">
                      <h3 className="font-semibold text-gray-200 flex items-center gap-2"><span>🤖</span> AI Recommendations</h3>
                      <ol className="space-y-2.5">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                            <span className="text-sm text-gray-300 leading-relaxed">{r}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Competitors */}
                  {result.competitors?.length > 0 && (
                    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5 space-y-3">
                      <h3 className="font-semibold text-gray-200 flex items-center gap-2"><span>🏆</span> Competitor Comparison</h3>
                      <div className="space-y-3">
                        {/* Your site */}
                        <div className="flex items-center gap-3">
                          <div className="w-32 text-xs text-violet-400 font-medium truncate">{result.url?.replace(/^https?:\/\//,"").split("/")[0]}</div>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{ width:`${result.score}%` }}/>
                          </div>
                          <ScoreBadge score={result.score}/>
                        </div>
                        {result.competitors.map((c, i) => {
                          const { stroke } = scoreColor(c.score);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-32 text-xs text-gray-400 truncate">{c.domain}</div>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${c.score}%`, background: stroke }}/>
                              </div>
                              <ScoreBadge score={c.score}/>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick top issues */}
                  {result.issues?.filter(i => i.type === "error").length > 0 && (
                    <div className="bg-[#0d0d1a] border border-red-500/20 rounded-2xl p-5 space-y-3">
                      <h3 className="font-semibold text-gray-200 flex items-center gap-2"><span>🚨</span> Critical Issues</h3>
                      {result.issues.filter(i => i.type === "error").slice(0, 3).map((iss, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span className="text-red-400 flex-shrink-0">●</span>
                          <div>
                            <span className="text-white font-medium">{iss.title}</span>
                            <span className="text-gray-500 ml-2 text-xs">+{iss.impact} pts if fixed</span>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab("issues")} className="text-xs text-violet-400 hover:text-violet-300">
                        View all issues →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Issues tab ── */}
              {activeTab === "issues" && (
                <div className="space-y-4">
                  {/* Filter */}
                  <div className="flex gap-2 flex-wrap">
                    {(["all","error","warning","info"] as const).map(f => (
                      <button key={f} onClick={() => setIssueFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                          issueFilter === f ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        }`}>
                        {f === "all" ? `All (${result.issues?.length ?? 0})` : f === "error" ? `❌ Errors (${result.issues?.filter(i=>i.type==="error").length ?? 0})` : f === "warning" ? `⚠️ Warnings (${result.issues?.filter(i=>i.type==="warning").length ?? 0})` : `ℹ️ Info (${result.issues?.filter(i=>i.type==="info").length ?? 0})`}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredIssues.map((iss, i) => (
                      <div key={i} className={`border rounded-2xl p-4 ${ISSUE_STYLE[iss.type] ?? "border-white/10 bg-white/5"}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">{ISSUE_ICON[iss.type]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-white">{iss.title}</span>
                              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{iss.category}</span>
                              <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md font-semibold">+{iss.impact} pts</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{iss.description}</p>
                            {iss.fix && (
                              <div className="mt-2.5 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300">
                                <span className="text-green-400 font-semibold">🔧 Fix: </span>{iss.fix}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Keywords tab ── */}
              {activeTab === "keywords" && (
                <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold text-gray-200">Keyword Analysis</h3>
                  <div className="grid gap-3">
                    {result.keywords?.map((kw, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                        <div className="flex-1 font-medium text-sm text-white">{kw.word}</div>
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <div className="text-center">
                            <div className="text-gray-500 mb-0.5">Density</div>
                            <div className="text-white font-semibold">{typeof kw.density === "number" ? `${kw.density.toFixed(2)}%` : kw.density}</div>
                          </div>
                          {kw.volume && (
                            <div className="text-center">
                              <div className="text-gray-500 mb-0.5">Volume</div>
                              <div className="text-white font-semibold">{kw.volume}</div>
                            </div>
                          )}
                          {kw.difficulty && (
                            <div className="text-center">
                              <div className="text-gray-500 mb-0.5">Difficulty</div>
                              <div className="text-white font-semibold">{kw.difficulty}</div>
                            </div>
                          )}
                          <span className={`px-2.5 py-1 rounded-full border font-semibold capitalize ${KW_BADGE[kw.status] ?? ""}`}>
                            {kw.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="text-green-400 font-semibold">Good</span>: 1–3% density &nbsp;·&nbsp;
                    <span className="text-yellow-400 font-semibold">Low</span>: under-optimized &nbsp;·&nbsp;
                    <span className="text-orange-400 font-semibold">High</span>: keyword stuffing risk &nbsp;·&nbsp;
                    <span className="text-red-400 font-semibold">Missing</span>: not found on page
                  </p>
                </div>
              )}

              {/* ── Road to 100% tab ── */}
              {activeTab === "road" && (
                <div className="space-y-4">

                  {/* Progress tracker */}
                  <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">Your Progress</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Check off tasks as you complete them</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-violet-400">{Math.min(completedScore, 100)}</div>
                        <div className="text-xs text-gray-500">projected score</div>
                      </div>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width:`${Math.min(completedScore, 100)}%` }}/>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>Current: {result.score}</span>
                      <span>{roadItems.filter(r=>r.done).length}/{roadItems.length} tasks done</span>
                      <span>Target: 100</span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2.5">
                    {roadItems.map((item, i) => (
                      <div key={i}
                        onClick={() => toggleRoadItem(i)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:bg-white/5 ${
                          item.done ? "border-green-500/30 bg-green-500/5 opacity-70" : "border-white/10 bg-[#0d0d1a]"
                        }`}>
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          item.done ? "bg-green-500 border-green-500" : "border-white/30"
                        }`}>
                          {item.done && <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${item.done ? "line-through text-gray-500" : "text-white"}`}>
                              {item.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{item.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${effortColor(item.effort)}`}>{item.effort}</span>
                            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md font-semibold">+{item.impact} pts</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-black text-white">#{item.priority}</div>
                          <div className="text-xs text-gray-600">priority</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {roadItems.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">No road items available</div>
                  )}
                </div>
              )}

              {/* ── History tab ── */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">No analysis history yet</div>
                  ) : (
                    history.map(h => {
                      const { text, bg } = scoreColor(h.score);
                      return (
                        <div key={h.id}
                          onClick={() => { setUrlInput(h.url.replace(/^https?:\/\//,"")); }}
                          className="flex items-center gap-4 bg-[#0d0d1a] border border-white/10 rounded-2xl px-5 py-4 hover:border-violet-500/30 cursor-pointer transition-all group">
                          <div className={`text-2xl font-black ${text}`}>{h.score}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{h.url}</div>
                            {h.keywords && <div className="text-xs text-gray-500 mt-0.5">Keywords: {h.keywords}</div>}
                            <div className="text-xs text-gray-600 mt-0.5">
                              {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}
                            </div>
                          </div>
                          <div className={`text-xs px-2.5 py-1 rounded-full font-semibold ${bg} ${text}`}>
                            {scoreColor(h.score).label}
                          </div>
                          <span className="text-gray-600 group-hover:text-violet-400 transition-colors text-xs">Re-analyze →</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          )}

          {/* Empty state before any analysis */}
          {!result && !analyzing && (
            <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-3xl">📈</div>
              <div>
                <h3 className="font-bold text-gray-200">Enter a URL to get started</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">Get a detailed AI-powered SEO audit with score breakdown, issues list, keyword analysis, and a clear step-by-step path to reach 100%</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 w-full max-w-lg">
                {[
                  { icon:"📊", label:"Score Breakdown" },
                  { icon:"🔎", label:"Issue Detection" },
                  { icon:"🔑", label:"Keyword Analysis" },
                  { icon:"🚀", label:"Road to 100%" },
                ].map(f => (
                  <div key={f.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="text-xs text-gray-400">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
