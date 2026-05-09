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
  purple: "#7c3aed",
  green:  "#22c55e",
  blue:   "#3b82f6",
  yellow: "#f59e0b",
};

interface Payment {
  id:            string;
  hireRequestId: string;
  clientName:    string;
  projectTitle:  string;
  amount:        string;        // formatted "LKR 1,000"
  amountNumeric: number;
  method:        string;
  note:          string;
  status:        string;        // pending | escrowed | released
  createdAt:     string | null;
  paidAt:        string | null;
  releasedAt:    string | null;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function methodIcon(m: string) {
  return { card:"💳", bank:"🏦", payhere:"📱", cash:"💵" }[m] || "💰";
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function fmt(n: number) {
  return `LKR ${n.toLocaleString()}`;
}

// Build last-6-months chart data from payments
function buildChart(payments: Payment[]) {
  const now   = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), total: 0 };
  });
  payments.forEach(p => {
    const dateStr = p.releasedAt || p.createdAt;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const slot = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (slot) slot.total += p.amountNumeric || 0;
  });
  return months;
}

export default function EarningsPage() {
  const { token, authLoading } = useFreelancerUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
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

  // Only count released payments as "earned" (not escrowed)
  const released     = payments.filter(p => p.status === "released");
  const inEscrow     = payments.filter(p => p.status === "escrowed");
  const totalEarned  = released.reduce((s, p) => s + (p.amountNumeric || 0), 0);
  const totalEscrow  = inEscrow.reduce((s, p) => s + (p.amountNumeric || 0), 0);
  const thisMonth    = (() => {
    const now = new Date();
    return released
      .filter(p => { const d = new Date(p.releasedAt || p.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, p) => s + (p.amountNumeric || 0), 0);
  })();
  const chartData    = buildChart(released);
  const chartMax     = Math.max(...chartData.map(m => m.total), 1);

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Earnings</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Your income overview from completed client projects</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Released",  val: fmt(totalEarned),       color: C.green,  icon: "✅" },
          { label: "In Escrow",       val: fmt(totalEscrow),        color: C.blue,   icon: "🔒" },
          { label: "This Month",      val: fmt(thisMonth),          color: C.accent, icon: "📅" },
          { label: "Total Projects",  val: payments.length,         color: "#f59e0b",icon: "📁" },
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

      {/* 6-Month Bar Chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", marginBottom: 28 }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📊 Earnings — Last 6 Months</p>
        {totalEarned === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: C.muted, fontSize: 13 }}>
            No earnings yet. Completed projects will appear here.
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
            {chartData.map(m => {
              const pct = chartMax > 0 ? (m.total / chartMax) * 100 : 0;
              return (
                <div key={m.label + m.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {m.total > 0 && (
                    <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                      {m.total >= 1000 ? `${(m.total/1000).toFixed(1)}k` : m.total}
                    </span>
                  )}
                  <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 120 }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max(pct, m.total > 0 ? 4 : 0)}%`,
                      background: m.total > 0
                        ? "linear-gradient(180deg,#7c3aed,#3b82f6)"
                        : "rgba(255,255,255,0.06)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.4s ease",
                      minHeight: m.total > 0 ? 6 : 0,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Transaction History</p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
            <p>Loading…</p>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>No transactions yet</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>Payments from clients will appear here once projects are paid.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 1fr 0.9fr", gap: 12, padding: "10px 22px", borderBottom: `1px solid ${C.border}` }}>
              {["Project", "Client", "Amount", "Method", "Date", "Status"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</span>
              ))}
            </div>
            {payments.map((p, i) => {
              const statusColor = p.status === "released" ? C.green : p.status === "escrowed" ? C.blue : C.yellow;
              const statusLabel = p.status === "released" ? "✅ Released" : p.status === "escrowed" ? "🔒 Escrow" : "⏳ Pending";
              return (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 1fr 0.9fr", gap: 12,
                padding: "14px 22px", alignItems: "center",
                borderBottom: i < payments.length - 1 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.projectTitle || "Project"}
                  </p>
                  {p.note && <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.note}</p>}
                </div>
                <span style={{ fontSize: 13, color: C.subtle }}>{p.clientName || "—"}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: p.status === "released" ? C.green : C.blue, fontFamily: "'JetBrains Mono',monospace" }}>{p.amount}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{methodIcon(p.method)} {p.method === "demo" ? "Demo" : p.method || "—"}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(p.releasedAt || p.createdAt)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
