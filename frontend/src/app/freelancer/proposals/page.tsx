"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const C = {
  bg:      "#0d0f1a",
  surface: "#111827",
  card:    "#1a2035",
  border:  "rgba(255,255,255,0.08)",
  text:    "#e2e8f0",
  muted:   "#64748b",
  accent:  "#7c3aed",
  green:   "#22c55e",
  red:     "#ef4444",
  yellow:  "#f59e0b",
  blue:    "#3b82f6",
};

interface HireRequest {
  id:                 string;
  clientUid:          string;
  clientName:         string;
  projectDescription: string;
  budget:             string;
  status:             "pending" | "accepted" | "declined" | "completed";
  createdAt:          string;
  updatedAt:          string;
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: "⏳ Pending",   bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" },
    accepted:  { label: "✅ Accepted",  bg: "rgba(34,197,94,0.15)",   color: "#22c55e" },
    declined:  { label: "✕ Declined",  bg: "rgba(239,68,68,0.15)",   color: "#ef4444" },
    completed: { label: "🏁 Completed", bg: "rgba(59,130,246,0.15)",  color: "#3b82f6" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

export default function HireRequestsPage() {
  const { token, authLoading } = useFreelancerUser();
  const [requests,  setRequests]  = useState<HireRequest[]>([]);
  const [filter,    setFilter]    = useState<"all"|"pending"|"accepted"|"declined"|"completed">("all");
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async (t: string) => {
    try {
      const res  = await fetch(`${API}/freelancer/requests`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchRequests(token);
    pollRef.current = setInterval(() => fetchRequests(token), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, fetchRequests]);

  const handleAction = async (id: string, status: "accepted" | "declined" | "completed") => {
    if (!token) return;
    setActing(id + status);
    try {
      const res  = await fetch(`${API}/freelancer/requests/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Request ${status} successfully!`);
        fetchRequests(token);
      } else {
        showToast(data.message || "Action failed", false);
      }
    } catch { showToast("Network error", false); }
    finally { setActing(null); }
  };

  if (authLoading) return null;

  const filtered = requests.filter(r => filter === "all" || r.status === filter);

  const counts = {
    all:       requests.length,
    pending:   requests.filter(r => r.status === "pending").length,
    accepted:  requests.filter(r => r.status === "accepted").length,
    declined:  requests.filter(r => r.status === "declined").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  const filterTabs: { key: typeof filter; label: string; color: string }[] = [
    { key: "all",       label: `All (${counts.all})`,               color: C.accent },
    { key: "pending",   label: `Pending (${counts.pending})`,        color: C.yellow },
    { key: "accepted",  label: `Accepted (${counts.accepted})`,      color: C.green  },
    { key: "declined",  label: `Declined (${counts.declined})`,      color: C.red    },
    { key: "completed", label: `Completed (${counts.completed})`,    color: C.blue   },
  ];

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 999, background: toast.ok ? C.green : C.red, color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Hire Requests</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Manage hire requests sent by clients</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total",     val: counts.all,       color: C.accent },
          { label: "Pending",   val: counts.pending,   color: C.yellow },
          { label: "Accepted",  val: counts.accepted,  color: C.green  },
          { label: "Completed", val: counts.completed, color: C.blue   },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 24px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            background: filter === t.key ? t.color + "22" : "transparent",
            border: `1px solid ${filter === t.key ? t.color : C.border}`,
            color: filter === t.key ? t.color : C.muted,
            borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
          <p>Loading hire requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No hire requests yet</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            {filter === "all" ? "When clients hire you from the Marketplace, requests will appear here." : `No ${filter} requests found.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(req => (
            <div key={req.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>

                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", flexShrink: 0 }}>
                      {(req.clientName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{req.clientName || "Client"}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>Sent {fmtDate(req.createdAt)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 480 }}>
                    {req.projectDescription || "No description provided."}
                  </p>
                  {req.budget && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa", marginTop: 8 }}>
                      💰 Budget: {req.budget}
                    </p>
                  )}
                </div>

                {/* Right: status + actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                  <StatusBadge status={req.status} />

                  {req.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAction(req.id, "declined")}
                        disabled={!!acting}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: C.red, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        {acting === req.id + "declined" ? "…" : "✕ Decline"}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "accepted")}
                        disabled={!!acting}
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: C.green, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        {acting === req.id + "accepted" ? "…" : "✓ Accept"}
                      </button>
                    </div>
                  )}

                  {req.status === "accepted" && (
                    <button
                      onClick={() => handleAction(req.id, "completed")}
                      disabled={!!acting}
                      style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: C.blue, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      {acting === req.id + "completed" ? "…" : "🏁 Mark Complete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
