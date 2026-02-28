"use client";

import { useState } from "react";
import { C } from "@/components/freelancer/dashboard/dashboardData";

interface PaymentMethod {
  icon: string;
  name: string;
  detail: string;
  primary: boolean;
}

interface Props {
  availableBalance: number;
  methods: PaymentMethod[];
  onClose: () => void;
  onConfirm: (amount: string, method: string) => void;
}

export default function PaymentModal({ availableBalance, methods, onClose, onConfirm }: Props) {
  const [amount,         setAmount] = useState("");
  const [selectedMethod, setMethod] = useState(methods[0]?.name || "");
  const [step,           setStep]   = useState<"form" | "confirm" | "success">("form");

  const fmt = (n: number) => `LKR ${n.toLocaleString()}`;

  const handleConfirm = () => {
    if (!amount || isNaN(Number(amount)))       return;
    if (Number(amount) > availableBalance)       return;
    if (Number(amount) <= 0)                     return;
    setStep("confirm");
  };

  const handleFinalConfirm = () => {
    setStep("success");
    setTimeout(() => {
      onConfirm(amount, selectedMethod);
      onClose();
    }, 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; }
        .overlay-bg       { position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:50;display:flex;align-items:center;justify-content:center; }
        .modal-btn:hover  { background:#6d28d9 !important; transform:translateY(-1px); }
        .method-row:hover { border-color:rgba(124,58,237,0.4) !important; background:rgba(124,58,237,0.06) !important; }
        .quick-btn:hover  { background:rgba(124,58,237,0.14) !important; border-color:rgba(124,58,237,0.4) !important; color:${C.accent} !important; }
        input::placeholder { color:${C.muted}; }
      `}</style>

      <div className="overlay-bg" onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: 440, fontFamily: "'Sora',sans-serif", color: C.text }}
        >

          {/* ── Step 1: Form ── */}
          {step === "form" && (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>💳 Withdraw Funds</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Transfer to your linked account</p>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20 }}>✕</button>
              </div>

              {/* Balance card */}
              <div style={{ background: "linear-gradient(135deg,#1a1040,#0f172a)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Available Balance</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
                    {fmt(availableBalance)}
                  </p>
                </div>
                <span style={{ fontSize: 32 }}>💰</span>
              </div>

              {/* Amount input */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>Amount (LKR)</p>
                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  type="number"
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14, fontFamily: "'Sora',sans-serif", outline: "none" }}
                />
                {/* Quick amount buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[10000, 25000, 44000].map(q => (
                    <button key={q} className="quick-btn" onClick={() => setAmount(String(q))} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px", fontSize: 12, fontWeight: 600, color: C.subtle, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.15s" }}>
                      {fmt(q)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method selector */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>Send To</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {methods.map(m => (
                    <div
                      key={m.name}
                      className="method-row"
                      onClick={() => setMethod(m.name)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: selectedMethod === m.name ? C.purpleGlow : C.surface, border: `1px solid ${selectedMethod === m.name ? C.purple : C.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.18s" }}
                    >
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: C.muted }}>{m.detail}</p>
                      </div>
                      {m.primary && (
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.purpleGlow, border: `1px solid rgba(124,58,237,0.3)`, color: C.accent, fontWeight: 600 }}>
                          Primary
                        </span>
                      )}
                      {/* Radio circle */}
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedMethod === m.name ? C.purple : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {selectedMethod === m.name && (
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.purple }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="modal-btn" onClick={handleConfirm} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}>
                  Continue →
                </button>
                <button onClick={onClose} style={{ flex: 1, background: "transparent", color: C.subtle, border: `1px solid ${C.border}`, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === "confirm" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
                <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Confirm Withdrawal</p>
                <p style={{ fontSize: 13, color: C.muted }}>Please review your withdrawal details</p>
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                {[
                  { label: "Amount",       val: fmt(Number(amount)), color: C.green  },
                  { label: "Send To",      val: selectedMethod,       color: C.text   },
                  { label: "Fee",          val: "LKR 0 (Free)",       color: C.muted  },
                  { label: "You Receive",  val: fmt(Number(amount)), color: C.accent },
                ].map((r, i, arr) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "'JetBrains Mono',monospace" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="modal-btn" onClick={handleFinalConfirm} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}>
                  ✅ Confirm Withdraw
                </button>
                <button onClick={() => setStep("form")} style={{ flex: 1, background: "transparent", color: C.subtle, border: `1px solid ${C.border}`, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                  ← Back
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
                ✅
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Withdrawal Initiated!</p>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                <strong style={{ color: C.green }}>{fmt(Number(amount))}</strong> is being transferred to your{" "}
                <strong style={{ color: C.text }}>{selectedMethod}</strong> account.
              </p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Usually arrives within 1–3 business days.</p>
              <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: C.green }}>🔔 You will receive a confirmation email shortly.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}