"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken, User } from "firebase/auth";
import { Timestamp, collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestStatus = "pending" | "accepted" | "declined" | "completed";
type Tab = "requests" | "projects" | "earnings" | "profile";

interface HireRequest {
  id: string;
  clientUid: string;
  clientName: string;
  freelancerUid: string;
  freelancerName: string;
  projectDescription: string;
  budget: string;
  status: RequestStatus;
  paid?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface Payment {
  id: string;
  freelancerUid: string;
  clientUid: string;
  clientName: string;
  hireRequestId: string;
  projectTitle: string;
  amount: string;
  amountNumeric: number;
  method: string;
  status: string;
  createdAt: Timestamp;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: any): string {
  if (!ts) return "";
  const ms = ts instanceof Timestamp ? ts.toMillis() : ts?.toDate?.()?.getTime?.() || new Date(ts).getTime();
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatLKR(n: number) {
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}k`;
  return `LKR ${n.toLocaleString()}`;
}

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  accepted:  "bg-green-500/15 text-green-400 border-green-500/30",
  declined:  "bg-red-500/15 text-red-400 border-red-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};
const STATUS_ICON: Record<RequestStatus, string> = { pending:"⏳", accepted:"✅", declined:"❌", completed:"🏆" };

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon:string; label:string; value:string|number; color:string }) {
  return (
    <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400 font-medium">{label}</div>
    </div>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({ req, onRespond, responding }: {
  req: HireRequest;
  onRespond: (id: string, status: "accepted"|"declined"|"completed") => void;
  responding: string | null;
}) {
  const isLoading = responding === req.id;
  return (
    <div className="bg-[#0d0d1a] border border-white/10 hover:border-violet-500/30 rounded-2xl p-5 transition-all space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {req.clientName?.charAt(0) || "C"}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{req.clientName}</p>
            <p className="text-xs text-gray-500">{timeAgo(req.createdAt)}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1 ${STATUS_STYLE[req.status]}`}>
          {STATUS_ICON[req.status]} {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
        </span>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-xl p-3">
        <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">{req.projectDescription}</p>
      </div>

      {req.budget && req.budget !== "Negotiable" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Budget:</span>
          <span className="text-sm font-bold text-green-400">{req.budget}</span>
          {req.paid && <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">💰 Paid</span>}
        </div>
      )}

      {req.status === "pending" && (
        <div className="flex gap-2">
          <button onClick={() => onRespond(req.id, "accepted")} disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
            {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "✅ Accept"}
          </button>
          <button onClick={() => onRespond(req.id, "declined")} disabled={isLoading}
            className="flex-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 text-sm font-semibold py-2.5 rounded-xl transition-all">
            ❌ Decline
          </button>
        </div>
      )}
      {req.status === "accepted" && (
        <button onClick={() => onRespond(req.id, "completed")} disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
          {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "🏆 Mark as Completed"}
        </button>
      )}
    </div>
  );
}

// ─── EarningsChart ────────────────────────────────────────────────────────────
function EarningsChart({ payments }: { payments: Payment[] }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();

  // Build last 6 months of data
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = months[d.getMonth()];
    const total = payments
      .filter(p => {
        const pd = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt as any);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      })
      .reduce((s, p) => s + (p.amountNumeric || 0), 0);
    return { label, total };
  });

  const max = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-white mb-5">📊 Monthly Earnings (LKR)</h3>
      <div className="flex items-end gap-3 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 font-semibold">
              {d.total > 0 ? formatLKR(d.total) : ""}
            </span>
            <div className="w-full rounded-t-lg transition-all" style={{
              height: `${Math.max((d.total / max) * 100, d.total > 0 ? 8 : 2)}%`,
              background: i === 5
                ? "linear-gradient(to top, #7c3aed, #a78bfa)"
                : "linear-gradient(to top, #4c1d95, #6d28d9)",
              opacity: d.total === 0 ? 0.2 : 1,
            }}/>
            <span className="text-[10px] text-gray-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────
function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[#0d0d1a] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Notifications</p>
            {unread > 0 && <span className="text-xs text-violet-400">{unread} unread</span>}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications</div>
            ) : notifications.slice(0, 10).map(n => (
              <div key={n.id} className={`px-4 py-3 transition-all ${n.read ? "opacity-60" : "bg-white/3"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{n.type === "payment" ? "💰" : n.type === "message" ? "💬" : "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5"/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FreelancerHubPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [token,       setToken]         = useState("");
  const [userName,    setUserName]       = useState("");
  const [userInitial, setUserInitial]   = useState("U");
  const [userPhoto,   setUserPhoto]     = useState("");

  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeTab,    setActiveTab]    = useState<Tab>("requests");
  const [statusFilter, setStatusFilter] = useState<"all"|RequestStatus>("all");

  const [requests,     setRequests]     = useState<HireRequest[]>([]);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [notifications,setNotifications]= useState<Notification[]>([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [responding,   setResponding]   = useState<string | null>(null);

  const [profile, setProfile] = useState({ fullName:"", category:"", bio:"", rate:"", location:"", skills:"", available:true });
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.replace("/login"); return; }
      setCurrentUser(user);
      setAuthLoading(false);

      // Load user info from Firestore
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const name = d.fullName || user.displayName || "Freelancer";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
        } else {
          const name = user.displayName || "Freelancer";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(user.photoURL || "");
        }
      } catch {}

      const t = await getIdToken(user);
      setToken(t);
    });
    return () => unsub();
  }, [router]);

  // ── Real-time notifications ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "notifications"), where("userId", "==", currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => {
          const ta = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      setNotifications(docs);
    });
    return () => unsub();
  }, [currentUser]);

  // ── Fetch requests + payments via backend API ─────────────────────────────
  const fetchData = useCallback(async (authToken: string) => {
    if (!authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };
    try {
      const [reqRes, payRes, profileRes] = await Promise.all([
        fetch(`${API}/freelancer/requests`, { headers }),
        fetch(`${API}/freelancer/payments`, { headers }),
        fetch(`${API}/freelancer/profile`,  { headers }),
      ]);
      const [reqData, payData, profileData] = await Promise.all([
        reqRes.json(), payRes.json(), profileRes.json()
      ]);
      if (reqData.success)     setRequests(reqData.requests || []);
      if (payData.success)     setPayments(payData.payments || []);
      if (profileData.success && profileData.profile) {
        const p = profileData.profile;
        setProfile({
          fullName:  p.fullName  || "",
          category:  p.category  || "",
          bio:       p.bio       || "",
          rate:      p.rate      || "",
          location:  p.location  || "",
          skills:    Array.isArray(p.skills) ? p.skills.join(", ") : (p.skills || ""),
          available: p.available !== false,
        });
      }
    } catch {}
    setDataLoading(false);
  }, []);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!token) return;
    fetchData(token);
    pollRef.current = setInterval(() => fetchData(token), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, fetchData]);

  // ── Respond to request ────────────────────────────────────────────────────
  const handleRespond = useCallback(async (id: string, status: "accepted"|"declined"|"completed") => {
    if (!token) return;
    setResponding(id);
    try {
      await fetch(`${API}/freelancer/requests/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchData(token);
    } catch {}
    setResponding(null);
  }, [token, fetchData]);

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async () => {
    if (!token) return;
    setSaving(true); setSaveMsg("");
    try {
      const skillsArr = profile.skills.split(",").map(s => s.trim()).filter(Boolean);
      const res  = await fetch(`${API}/freelancer/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, skills: skillsArr }),
      });
      const data = await res.json();
      setSaveMsg(data.success ? "✅ Profile saved!" : "❌ " + data.message);
    } catch { setSaveMsg("❌ Network error"); }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }, [token, profile]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const pendingCount   = requests.filter(r => r.status === "pending").length;
  const activeCount    = requests.filter(r => r.status === "accepted").length;
  const completedCount = requests.filter(r => r.status === "completed").length;
  const totalEarnings  = payments.reduce((s, p) => s + (p.amountNumeric || 0), 0);
  const thisMonthEarnings = payments.filter(p => {
    const d = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt as any);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + (p.amountNumeric || 0), 0);

  const filteredRequests = statusFilter === "all" ? requests : requests.filter(r => r.status === statusFilter);
  const activeProjects   = requests.filter(r => r.status === "accepted");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar sidebarOpen={sidebarOpen} activeLink="Freelancer Hub" setActiveLink={() => {}}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        userPlan="Freelancer" isFreelancer={true}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="bg-[#0d0d1a]/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white text-xl">☰</button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                🧑‍💼 Freelancer Hub
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {pendingCount} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400">Manage your hire requests and earnings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications}/>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 px-4 py-2 rounded-xl">
              <span className="text-green-400 text-sm font-bold">💰 LKR {totalEarnings.toLocaleString()}</span>
              <span className="text-gray-500 text-xs">Total Earned</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="⏳" label="Pending Requests"  value={pendingCount}   color="from-amber-500/20 to-orange-500/10"/>
            <StatCard icon="🚀" label="Active Projects"   value={activeCount}    color="from-violet-500/20 to-indigo-500/10"/>
            <StatCard icon="🏆" label="Completed Orders"  value={completedCount} color="from-blue-500/20 to-cyan-500/10"/>
            <StatCard icon="💰" label="Total Earnings"    value={`LKR ${totalEarnings.toLocaleString()}`} color="from-green-500/20 to-emerald-500/10"/>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
            {([
              { key:"requests", label:`📋 Hire Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
              { key:"projects", label:`🚀 Active Projects${activeCount > 0 ? ` (${activeCount})` : ""}` },
              { key:"earnings", label:"💰 Earnings" },
              { key:"profile",  label:"⚙️ My Profile" },
            ] as {key:Tab; label:string}[]).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t.key
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ══ HIRE REQUESTS TAB ══ */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(["all","pending","accepted","declined","completed"] as const).map(f => {
                  const count = f === "all" ? requests.length : requests.filter(r => r.status === f).length;
                  return (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                        statusFilter === f
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}>
                      {f === "all" ? "All" : `${STATUS_ICON[f]} ${f}`}
                      {count > 0 && <span className="ml-1.5 bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full text-xs">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-lg font-bold mb-2">No requests here</p>
                  <p className="text-sm text-gray-400">
                    {statusFilter === "all" ? "Clients haven't sent you any hire requests yet." : `No ${statusFilter} requests right now.`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRequests.map(req => (
                    <RequestCard key={req.id} req={req} onRespond={handleRespond} responding={responding}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ACTIVE PROJECTS TAB ══ */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label:"Active Projects",  value:activeCount,                     color:"text-violet-400" },
                  { label:"Total Value",       value:`LKR ${requests.filter(r=>r.status==="accepted").reduce((s,r)=>s+parseFloat(r.budget?.replace(/[^0-9.]/g,"")||"0"),0).toLocaleString()}`, color:"text-green-400" },
                  { label:"Pending Payment",   value:requests.filter(r=>r.status==="accepted"&&!r.paid).length, color:"text-amber-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {activeProjects.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-lg font-bold mb-2">No active projects</p>
                  <p className="text-sm text-gray-400">Accept hire requests to start working on projects.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.map(req => {
                    const budgetNum = parseFloat(req.budget?.replace(/[^0-9.]/g, "") || "0");
                    const paidAmount = payments.find(p => p.hireRequestId === req.id)?.amountNumeric || 0;
                    const paidPct = budgetNum > 0 ? Math.round((paidAmount / budgetNum) * 100) : (req.paid ? 100 : 0);
                    return (
                      <div key={req.id} className="bg-[#0d0d1a] border border-violet-500/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/25 flex items-center justify-center text-2xl">
                              📁
                            </div>
                            <div>
                              <p className="text-base font-bold text-white line-clamp-1">{req.projectDescription?.slice(0, 60) || "Project"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">👤 {req.clientName} · Started {timeAgo(req.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-extrabold text-white">{req.budget || "Negotiable"}</p>
                            {paidAmount > 0
                              ? <p className="text-xs text-green-400">Paid: LKR {paidAmount.toLocaleString()}</p>
                              : <p className="text-xs text-amber-400">Payment pending</p>
                            }
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400 font-semibold">Payment Progress</p>
                            <p className="text-xs text-violet-400 font-bold">{paidPct}%</p>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${paidPct}%` }}/>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => router.push("/dashboard/messages")}
                            className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-lg font-semibold transition-all">
                            💬 Message Client
                          </button>
                          <button onClick={() => handleRespond(req.id, "completed")}
                            disabled={responding === req.id}
                            className="flex items-center gap-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50">
                            {responding === req.id
                              ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                              : "🏆"} Mark as Complete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ EARNINGS TAB ══ */}
          {activeTab === "earnings" && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label:"Total Earned",    value:`LKR ${totalEarnings.toLocaleString()}`,       color:"text-green-400",  icon:"💰" },
                  { label:"This Month",      value:`LKR ${thisMonthEarnings.toLocaleString()}`,   color:"text-violet-400", icon:"📅" },
                  { label:"Total Payments",  value:payments.length,                               color:"text-blue-400",   icon:"💳" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <EarningsChart payments={payments}/>

              {/* Transaction history */}
              <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white">Transaction History</h3>
                </div>
                {payments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">💳</div>
                    <p className="text-sm font-bold text-white mb-1">No payments yet</p>
                    <p className="text-xs text-gray-500">Payments from clients will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {/* Header */}
                    <div className="grid grid-cols-5 px-6 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      <div className="col-span-2">Project</div>
                      <div>Client</div>
                      <div>Amount</div>
                      <div>Date</div>
                    </div>
                    {payments.map(p => {
                      const date = p.createdAt instanceof Timestamp
                        ? p.createdAt.toDate().toLocaleDateString("en-LK", { month:"short", day:"numeric", year:"numeric" })
                        : "—";
                      const icon = p.projectTitle?.toLowerCase().includes("video") ? "🎬"
                        : p.projectTitle?.toLowerCase().includes("logo") ? "✏️"
                        : p.projectTitle?.toLowerCase().includes("email") ? "📧"
                        : p.projectTitle?.toLowerCase().includes("social") ? "📱"
                        : "📁";
                      return (
                        <div key={p.id} className="grid grid-cols-5 px-6 py-4 hover:bg-white/3 transition-all items-center">
                          <div className="col-span-2 flex items-center gap-3">
                            <span className="text-lg">{icon}</span>
                            <p className="text-sm text-white font-medium line-clamp-1">{p.projectTitle || "Project"}</p>
                          </div>
                          <div className="text-sm text-gray-400">{p.clientName || "—"}</div>
                          <div className="text-sm font-bold text-green-400">+{p.amount || `LKR ${p.amountNumeric}`}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{date}</span>
                            <span className="text-[10px] bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-semibold">✅ Paid</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PROFILE TAB ══ */}
          {activeTab === "profile" && (
            <div className="max-w-xl space-y-5">
              <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-white mb-1">Freelancer Profile</h2>
                <p className="text-xs text-gray-500 mb-4">This information is shown to clients in the marketplace.</p>

                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Full Name</label>
                  <input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your display name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Category</label>
                  <select value={profile.category} onChange={e => setProfile(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all">
                    <option value="">Select category</option>
                    {["Social Media Manager","Content Writer","Graphic Designer","Video Editor","SEO Specialist","Web Developer","Copywriter","Email Marketer","Brand Strategist","Digital Marketer"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={4}
                    placeholder="Tell clients about yourself and your expertise..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all resize-none"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Hourly Rate</label>
                    <input value={profile.rate} onChange={e => setProfile(p => ({ ...p, rate: e.target.value }))}
                      placeholder="e.g. LKR 2500/hr"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Location</label>
                    <input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="City, Country"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Skills <span className="font-normal text-gray-600">(comma separated)</span></label>
                  <input value={profile.skills} onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
                    placeholder="e.g. SEO, Copywriting, Canva"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"/>
                </div>
                <div className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Available for hire</p>
                    <p className="text-xs text-gray-500">Show green badge in marketplace</p>
                  </div>
                  <button onClick={() => setProfile(p => ({ ...p, available: !p.available }))}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${profile.available ? "bg-green-500" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile.available ? "left-7" : "left-1"}`}/>
                  </button>
                </div>
                <button onClick={handleSaveProfile} disabled={saving}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "💾 Save Profile"}
                </button>
                {saveMsg && <p className={`text-sm text-center font-semibold ${saveMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{saveMsg}</p>}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
