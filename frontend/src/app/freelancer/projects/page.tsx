"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const C = {
  bg:      "#0d0f1a",
  card:    "#1a2035",
  border:  "rgba(255,255,255,0.08)",
  text:    "#e2e8f0",
  muted:   "#64748b",
  accent:  "#7c3aed",
  green:   "#22c55e",
  blue:    "#3b82f6",
  yellow:  "#f59e0b",
};

interface HireRequest {
  id:                 string;
  clientUid:          string;
  clientName:         string;
  projectDescription: string;
  budget:             string;
  status:             "accepted" | "completed";
  paid:               boolean;
  paidAt:             string;
  createdAt:          string;
}

interface Payment {
  id:           string;
  hireRequestId:string;
  clientName:   string;
  projectTitle: string;
  amount:       string;
  amountNumeric:number;
  method:       string;
  note:         string;
  createdAt:    string;
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function methodLabel(m: string) {
  const map: Record<string, string> = {
    card:    "💳 Card",
    bank:    "🏦 Bank Transfer",
    payhere: "📱 PayHere",
    cash:    "💵 Cash",
  };
  return map[m] || m;
}

export default function ActiveProjectsPage() {
  const { token, authLoading } = useFreelancerUser();
  const [projects,  setProjects]  = useState<(HireRequest & { payment?: Payment })[]>([]);
  const [filter,    setFilter]    = useState<"in_progress" | "completed">("in_progress");
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async (t: string) => {
    try {
      const [reqRes, payRes] = await Promise.all([
        fetch(`${API}/freelancer/requests`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/freelancer/payments`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      const reqData = await reqRes.json();
      const payData = await payRes.json();

      const payments: Payment[] = payData.success ? payData.payments : [];

      // Active projects = accepted or completed requests where client has paid
      const active = (reqData.requests || [])
        .filter((r: HireRequest) => r.paid && (r.status === "accepted" || r.status === "completed"))
        .map((r: HireRequest) => ({
          ...r,
          payment: payments.find(p => p.hireRequestId === r.id),
        }));

      setProjects(active);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchData(token);
    pollRef.current = setInterval(() => fetchData(token), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, fetchData]);

  const handleComplete = async (id: string) => {
    if (!token) return;
    setActing(id);
    try {
      const res  = await fetch(`${API}/freelancer/requests/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Project marked as completed!");
        fetchData(token);
      } else {
        showToast(data.message || "Failed", false);
      }
    } catch { showToast("Network error", false); }
    finally { setActing(null); }
  };

  if (authLoading) return null;

  const inProgress = projects.filter(p => p.status === "accepted");
  const completed  = projects.filter(p => p.status === "completed");
  const displayed  = filter === "in_progress" ? inProgress : completed;

  const totalEarned = completed.reduce((s, p) => s + (p.payment?.amountNumeric || 0), 0);

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 999, background: toast.ok ? C.green : "#ef4444", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Active Projects</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Projects where the client has paid — ready to start work</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "In Progress",    val: inProgress.length, color: C.blue   },
          { label: "Completed",      val: completed.length,  color: C.green  },
          { label: "Total Earned",   val: `LKR ${totalEarned.toLocaleString()}`, color: C.accent, wide: true },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 22px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[
          { key: "in_progress" as const, label: `🔨 In Progress (${inProgress.length})`, color: C.blue  },
          { key: "completed"   as const, label: `✅ Completed (${completed.length})`,     color: C.green },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            background: filter === t.key ? t.color + "22" : "transparent",
            border: `1px solid ${filter === t.key ? t.color : C.border}`,
            color: filter === t.key ? t.color : C.muted,
            borderRadius: 20, padding: "7px 18px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
          <p>Loading projects…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {filter === "in_progress" ? "🔨" : "🏁"}
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
            {filter === "in_progress" ? "No active projects yet" : "No completed projects yet"}
          </p>
          <p style={{ fontSize: 13 }}>
            {filter === "in_progress"
              ? "Projects appear here after a client accepts your work and makes a payment."
              : "Mark an in-progress project as complete to see it here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayed.map(proj => {
            const isOpen = expanded === proj.id;
            return (
              <div key={proj.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>

                {/* Card header — always visible */}
                <div
                  onClick={() => setExpanded(isOpen ? null : proj.id)}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", cursor: "pointer" }}
                >
                  {/* Client avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", flexShrink: 0 }}>
                    {(proj.clientName || "C").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{proj.clientName}</p>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                        background: proj.status === "completed" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                        color:      proj.status === "completed" ? C.green : C.blue,
                      }}>
                        {proj.status === "completed" ? "✅ Completed" : "🔨 In Progress"}
                      </span>
                      <span style={{ fontSize: 11, background: "rgba(34,197,94,0.12)", color: C.green, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                        💰 Paid
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
                      {proj.projectDescription || "No description"}
                    </p>
                  </div>

                  {/* Budget + expand */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                    {proj.budget && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>{proj.budget}</span>
                    )}
                    <span style={{ fontSize: 18, color: C.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Project description */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Project Description</p>
                      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{proj.projectDescription || "No description provided."}</p>
                    </div>

                    {/* Payment details */}
                    {proj.payment && (
                      <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 18px" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.green, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>💰 Payment Details</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                          {[
                            { label: "Amount Paid", val: proj.payment.amount },
                            { label: "Method",      val: methodLabel(proj.payment.method) },
                            { label: "Paid On",     val: fmtDate(proj.payment.createdAt) },
                            ...(proj.payment.note ? [{ label: "Note", val: proj.payment.note }] : []),
                          ].map(f => (
                            <div key={f.label}>
                              <p style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{f.label}</p>
                              <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{f.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Hired On</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmtDate(proj.createdAt)}</p>
                      </div>
                      {proj.paidAt && (
                        <div>
                          <p style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Payment Received</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.green }}>{fmtDate(proj.paidAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Mark complete button */}
                    {proj.status === "accepted" && (
                      <div>
                        <button
                          onClick={() => handleComplete(proj.id)}
                          disabled={acting === proj.id}
                          style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: acting === proj.id ? 0.6 : 1 }}
                        >
                          {acting === proj.id ? "Updating…" : "🏁 Mark as Completed"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
