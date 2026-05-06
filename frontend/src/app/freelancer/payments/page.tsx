"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const C = {
  card:   "#1a2035",
  border: "rgba(255,255,255,0.08)",
  text:   "#e2e8f0",
  muted:  "#64748b",
  subtle: "#94a3b8",
  accent: "#7c3aed",
  green:  "#22c55e",
  blue:   "#3b82f6",
  yellow: "#f59e0b",
  red:    "#ef4444",
};

interface Payment {
  id:            string;
  hireRequestId: string;
  clientName:    string;
  projectTitle:  string;
  amount:        string;       // formatted "LKR 1,000"
  amountNumeric: number;
  method:        string;
  note:          string;
  status:        string;       // pending | escrowed | released
  freelancerNet: number;
  platformFee:   number;
  createdAt:     string | null;
  paidAt:        string | null;
  releasedAt:    string | null;
}

const METHOD_MAP: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  card:    { icon: "💳", label: "Card",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  bank:    { icon: "🏦", label: "Bank Transfer", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  payhere: { icon: "📱", label: "PayHere",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  cash:    { icon: "💵", label: "Cash",          color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  demo:    { icon: "🧪", label: "Demo",          color: "#a78bfa", bg: "rgba(124,58,237,0.12)" },
  stripe:  { icon: "💳", label: "Stripe",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "⏳" },
  escrowed: { label: "In Escrow", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "🔒" },
  released: { label: "Released",  color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: "✅" },
  failed:   { label: "Failed",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: "❌" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PaymentsPage() {
  const { token, authLoading } = useFreelancerUser();
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<"all" | "escrowed" | "released">("all");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPayments = useCallback(async (t: string) => {
    try {
      const res  = await fetch(`${API}/freelancer/payments`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.success) setPayments(data.payments || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchPayments(token);
    pollRef.current = setInterval(() => fetchPayments(token), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, fetchPayments]);

  if (authLoading) return null;

  const released  = payments.filter(p => p.status === "released");
  const escrowed  = payments.filter(p => p.status === "escrowed");
  const totalNet  = released.reduce((s, p) => s + p.amountNumeric, 0);
  const inEscrow  = escrowed.reduce((s, p) => s + p.amountNumeric, 0);

  const displayed = filter === "all" ? payments
    : filter === "escrowed" ? escrowed
    : released;

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Payments</h1>
        <p style={{ fontSize: 13, color: C.muted }}>All payments received from client projects</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Released",  val: `LKR ${totalNet.toLocaleString()}`,   color: C.green,  icon: "✅" },
          { label: "In Escrow",       val: `LKR ${inEscrow.toLocaleString()}`,   color: C.blue,   icon: "🔒" },
          { label: "Total Payments",  val: payments.length,                       color: C.accent, icon: "📋" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0, fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Escrow notice */}
      {inEscrow > 0 && (
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.blue, margin: 0 }}>LKR {inEscrow.toLocaleString()} held in escrow</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Funds will be released to you once the client approves the completed work.</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { key: "all",      label: `All (${payments.length})`,    color: C.accent },
          { key: "escrowed", label: `In Escrow (${escrowed.length})`, color: C.blue  },
          { key: "released", label: `Released (${released.length})`,  color: C.green },
        ] as const).map(t => (
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

      {/* Payment cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.accent}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }}/>
          <p>Loading payments…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: "center", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
            {filter === "all" ? "No payments yet" : `No ${filter} payments`}
          </p>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            {filter === "all"
              ? "When clients pay for your projects, transactions will appear here."
              : filter === "escrowed"
                ? "No payments currently held in escrow."
                : "No released payments yet. Ask clients to approve completed work."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayed.map(p => {
            const st = STATUS_MAP[p.status] || STATUS_MAP.pending;
            const mt = METHOD_MAP[p.method] || { icon: "💰", label: p.method || "Unknown", color: C.muted, bg: "rgba(255,255,255,0.06)" };
            return (
              <div key={p.id} style={{ background: C.card, border: `1px solid ${p.status === "released" ? "rgba(34,197,94,0.2)" : p.status === "escrowed" ? "rgba(59,130,246,0.2)" : C.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>

                {/* Status icon */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: st.bg, border: `1px solid ${st.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {st.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 5px" }}>
                    {p.projectTitle}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>👤 {p.clientName}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: mt.bg, color: mt.color }}>
                      {mt.icon} {mt.label}
                    </span>
                    {p.note && (
                      <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>· "{p.note}"</span>
                    )}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: C.muted }}>Paid: {fmtDate(p.paidAt || p.createdAt)}</span>
                    {p.releasedAt && <span style={{ fontSize: 11, color: C.green }}>Released: {fmtDate(p.releasedAt)}</span>}
                    {p.platformFee > 0 && <span style={{ fontSize: 11, color: C.muted }}>Platform fee: LKR {p.platformFee.toLocaleString()}</span>}
                  </div>
                </div>

                {/* Amount + Status */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: p.status === "released" ? C.green : C.blue, fontFamily: "'JetBrains Mono',monospace" }}>
                    +{p.amount}
                  </span>
                  <span style={{ fontSize: 11, background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
