"use client";

import { useState, useEffect, useCallback } from "react";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

interface Withdrawal {
  id:            string;
  freelancerUid: string;
  freelancerName:string;
  amount:        number;
  currency:      string;
  status:        "pending" | "processing" | "completed" | "rejected";
  accountLabel:  string;
  accountDetail: string;
  accountType:   string;
  createdAt:     string | null;
  processedAt:   string | null;
  note:          string;
}

const STATUS_STYLE: Record<string, string> = {
  pending:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/15   text-blue-400   border-blue-500/30",
  completed:  "bg-green-500/15  text-green-400  border-green-500/30",
  rejected:   "bg-red-500/15    text-red-400    border-red-500/30",
};

const STATUS_NEXT: Record<string, { label: string; value: string; cls: string }[]> = {
  pending: [
    { label: "Mark Processing", value: "processing", cls: "bg-blue-600 hover:bg-blue-500" },
    { label: "Reject",          value: "rejected",   cls: "bg-red-600 hover:bg-red-500"  },
  ],
  processing: [
    { label: "Mark Completed",  value: "completed",  cls: "bg-green-600 hover:bg-green-500" },
    { label: "Reject",          value: "rejected",   cls: "bg-red-600 hover:bg-red-500"     },
  ],
  completed: [],
  rejected:  [],
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminWithdrawalsPage() {
  const router  = useRouter();
  const [token,       setToken]       = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats,       setStats]       = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<string>("all");
  const [acting,      setActing]      = useState<string | null>(null);
  const [noteModal,   setNoteModal]   = useState<{ id: string; nextStatus: string; label: string } | null>(null);
  const [noteText,    setNoteText]    = useState("");
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      const t = await getIdToken(user);
      setToken(t);
    });
    return () => unsub();
  }, [router]);

  const fetchData = useCallback(async (t: string) => {
    if (!t) return;
    try {
      const [wRes, sRes] = await Promise.all([
        fetch(`${API}/admin/withdrawals`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/admin/stats`,       { headers: { Authorization: `Bearer ${t}` } }),
      ]);

      if (wRes.status === 403) { router.push("/dashboard"); return; }

      const wData = await wRes.json();
      const sData = await sRes.json();

      if (wData.success) setWithdrawals(wData.withdrawals || []);
      if (sData.success) setStats(sData.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (token) fetchData(token);
  }, [token, fetchData]);

  const handleAction = async (id: string, nextStatus: string, note = "") => {
    if (!token) return;
    setActing(id);
    try {
      const res  = await fetch(`${API}/admin/withdrawals/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: nextStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(`Updated to: ${nextStatus} ✅`);
      fetchData(token);
    } catch (e: any) {
      showToast(e.message || "Failed", false);
    } finally {
      setActing(null);
      setNoteModal(null);
      setNoteText("");
    }
  };

  const filtered = filter === "all"
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  const counts = {
    all:        withdrawals.length,
    pending:    withdrawals.filter(w => w.status === "pending").length,
    processing: withdrawals.filter(w => w.status === "processing").length,
    completed:  withdrawals.filter(w => w.status === "completed").length,
    rejected:   withdrawals.filter(w => w.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-6 font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border ${
          toast.ok ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-red-500/20 border-red-500/40 text-red-300"
        }`}>{toast.msg}</div>
      )}

      {/* Note/Reason Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold">{noteModal.label}</h3>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Note / Reason (optional)</label>
              <textarea
                value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder={noteModal.nextStatus === "rejected" ? "Reason for rejection…" : "Any note for the freelancer…"}
                rows={3}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setNoteModal(null); setNoteText(""); }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleAction(noteModal.id, noteModal.nextStatus, noteText)}
                disabled={!!acting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                  noteModal.nextStatus === "rejected" ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
                }`}>
                {acting ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-xl">⚙️</div>
          <div>
            <h1 className="text-xl font-bold">Admin — Withdrawal Manager</h1>
            <p className="text-xs text-gray-400">Review and process freelancer withdrawal requests</p>
          </div>
          <button onClick={() => router.push("/dashboard")}
            className="ml-auto text-xs text-gray-500 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Users",       val: stats.totalUsers,          color: "#7c3aed", icon: "👥" },
              { label: "Pending Payouts",   val: stats.pendingWithdrawals,  color: "#f59e0b", icon: "⏳" },
              { label: "Total in Escrow",   val: `LKR ${(stats.totalEscrow||0).toLocaleString()}`,   color: "#3b82f6", icon: "🔒" },
              { label: "Platform Fees",     val: `LKR ${(stats.platformFees||0).toLocaleString()}`,  color: "#22c55e", icon: "💰" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span>{s.icon}</span>
                  <span className="text-[11px] text-gray-400">{s.label}</span>
                </div>
                <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["all","pending","processing","completed","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                filter === f
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}>
              {f} <span className="ml-1 text-xs opacity-70">({counts[f] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
              <p>Loading withdrawals…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-semibold text-white">No {filter === "all" ? "" : filter} withdrawals</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-b border-white/10 text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
                <span>Freelancer</span>
                <span>Amount</span>
                <span>Account</span>
                <span>Requested</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {filtered.map((wd, i) => (
                <div key={wd.id}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 items-center border-b border-white/5 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>

                  {/* Freelancer */}
                  <div>
                    <p className="text-sm font-semibold text-white">{wd.freelancerName}</p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">{wd.freelancerUid.slice(0,14)}…</p>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-green-400 font-mono">LKR {wd.amount.toLocaleString()}</p>

                  {/* Account */}
                  <div>
                    <p className="text-xs font-semibold text-white truncate">{wd.accountLabel}</p>
                    <p className="text-[11px] text-gray-500 truncate">{wd.accountDetail}</p>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-400">{fmtDate(wd.createdAt)}</p>

                  {/* Status */}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize w-fit ${STATUS_STYLE[wd.status]}`}>
                    {wd.status}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_NEXT[wd.status]?.map(action => (
                      <button key={action.value}
                        onClick={() => {
                          setNoteModal({ id: wd.id, nextStatus: action.value, label: action.label });
                          setNoteText(wd.note || "");
                        }}
                        disabled={acting === wd.id}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white transition-all disabled:opacity-50 ${action.cls}`}>
                        {acting === wd.id ? "…" : action.label}
                      </button>
                    ))}
                    {STATUS_NEXT[wd.status]?.length === 0 && (
                      <span className="text-[11px] text-gray-600 italic">Final</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-6 bg-white/4 border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Process Flow</p>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            {[
              { s: "pending",    c: "text-yellow-400", i: "⏳" },
              { s: "→",         c: "text-gray-600",   i: ""   },
              { s: "processing", c: "text-blue-400",   i: "🔄" },
              { s: "→",         c: "text-gray-600",   i: ""   },
              { s: "completed",  c: "text-green-400",  i: "✅" },
            ].map((item, idx) => (
              <span key={idx} className={`font-semibold ${item.c}`}>
                {item.i} {item.s}
              </span>
            ))}
            <span className="text-gray-600 mx-2">|</span>
            <span className="text-red-400 font-semibold">❌ rejected</span>
            <span className="text-gray-600 text-xs ml-4">(freelancer is notified at every step)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
