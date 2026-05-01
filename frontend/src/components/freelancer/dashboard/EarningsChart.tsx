"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

function parseLKR(budget: string): number {
  if (!budget) return 0;
  const n = budget.replace(/[^0-9]/g,"");
  return n ? parseInt(n) : 0;
}

export default function EarningsChart() {
  const { uid, totalEarnings } = useFreelancerUser();
  const [monthlyData, setMonthlyData] = useState<{month:string;amount:number}[]>([]);
  const [thisMonth,   setThisMonth]   = useState(0);
  const [pending,     setPending]     = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db,"hire_requests"), where("freelancerUid","==",uid));
    const unsub = onSnapshot(q, snap => {
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const now    = new Date();
      const totals: Record<string,number> = {};

      // Last 6 months
      for (let i=5; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        totals[key] = 0;
      }

      let thisMonthTotal = 0;
      let pendingTotal   = 0;

      snap.docs.forEach(doc => {
        const d = doc.data();
        const amt = parseLKR(d.budget || "");
        if (d.status === "completed") {
          const ts = d.createdAt?.toDate?.() || new Date(d.createdAt||0);
          const key = `${ts.getFullYear()}-${ts.getMonth()}`;
          if (key in totals) totals[key] += amt;
          // this month
          if (ts.getMonth()===now.getMonth() && ts.getFullYear()===now.getFullYear()) {
            thisMonthTotal += amt;
          }
        }
        if (d.status === "accepted") pendingTotal += amt;
      });

      const bars = Object.entries(totals).map(([key, amount]) => {
        const [yr, mo] = key.split("-").map(Number);
        return { month: MONTHS[mo], amount, year: yr };
      });

      setMonthlyData(bars);
      setThisMonth(thisMonthTotal);
      setPending(pendingTotal);
      setLoading(false);
    }, err => { if (err.code !== "permission-denied") console.error(err); setLoading(false); });
    return () => unsub();
  }, [uid]);

  const maxAmt = Math.max(...monthlyData.map(b=>b.amount), 1);
  const fmtLKR = (n:number) => n >= 1000 ? `LKR ${Math.round(n/1000)}k` : `LKR ${n}`;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}` }}>
        <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Earnings (6 Months)</p>
        <p style={{ fontSize:12, color:C.green, marginTop:2 }}>
          {loading ? "Loading…" : totalEarnings > 0 ? `${fmtLKR(totalEarnings)} total` : "No earnings yet"}
        </p>
      </div>

      {/* Chart */}
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
          {loading ? (
            Array.from({length:6}).map((_,i)=>(
              <div key={i} style={{ flex:1, height:`${30+i*10}%`, borderRadius:"5px 5px 0 0", background:C.border, opacity:0.5 }}/>
            ))
          ) : monthlyData.map((b,i) => {
            const pct = maxAmt > 0 ? (b.amount/maxAmt)*100 : 5;
            const isLast = i===monthlyData.length-1;
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5, height:"100%" }}>
                <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
                  <div title={fmtLKR(b.amount)} className="bar" style={{ width:"100%", height:`${Math.max(pct,4)}%`, borderRadius:"5px 5px 0 0", background:`linear-gradient(to top,${C.purple},${C.accent})`, opacity: isLast?1:0.55, transition:"opacity 0.2s", cursor:"pointer" }}/>
                </div>
                <span style={{ fontSize:10, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>{b.month}</span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{ display:"flex", gap:20, marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize:11, color:C.muted }}>This Month</p>
            <p style={{ fontSize:16, fontWeight:700, color:C.green, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
              {thisMonth > 0 ? fmtLKR(thisMonth) : "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.muted }}>Pending Payout</p>
            <p style={{ fontSize:16, fontWeight:700, color:C.yellow, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
              {pending > 0 ? fmtLKR(pending) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// We need to import db
import { db } from "@/lib/firebase";
