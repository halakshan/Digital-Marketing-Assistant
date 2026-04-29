"use client";

import { useState, useEffect } from "react";
import { getIdToken } from "firebase/auth";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

interface Stats {
  totalEarnings:   number;
  activeProjects:  number;
  pendingRequests: number;
  completedOrders: number;
  rating:          number;
  reviewCount:     number;
}

export default function StatsCards() {
  const { firebaseUser, completedOrders: ctxCompleted, rating: ctxRating } = useFreelancerUser();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const load = async () => {
      try {
        const token = await getIdToken(firebaseUser);
        const res = await fetch(`${API}/freelancer/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch { /**/ }
      finally { setLoading(false); }
    };
    load();
    // Refresh every 30s for live updates
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [firebaseUser]);

  const cards = [
    {
      label: "Total Earnings",
      val:   stats ? `LKR ${(stats.totalEarnings||0).toLocaleString()}` : "LKR 0",
      change: stats?.activeProjects ? `${stats.activeProjects} active project(s)` : "No active projects",
      color: C.accent, up: false,
    },
    {
      label: "Active Projects",
      val:   loading ? "…" : String(stats?.activeProjects ?? 0),
      change: stats?.pendingRequests ? `${stats.pendingRequests} pending request(s)` : "No new requests",
      color: C.green, up: (stats?.pendingRequests||0) > 0,
    },
    {
      label: "Completed Orders",
      val:   loading ? "…" : String(stats?.completedOrders ?? ctxCompleted ?? 0),
      change: stats?.reviewCount ? `${stats.reviewCount} review(s)` : "No reviews yet",
      color: C.blue, up: false,
    },
    {
      label: "Rating",
      val:   loading ? "…" : ((stats?.rating ?? ctxRating ?? 0) > 0 ? `${(stats?.rating ?? ctxRating ?? 0).toFixed(1)} ⭐` : "No rating"),
      change: stats?.reviewCount ? `From ${stats.reviewCount} review(s)` : "Earn your first review",
      color: C.yellow, up: false,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
      {cards.map(s => (
        <div key={s.label} className="lift" style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 20, cursor: "default", transition: "transform 0.18s,box-shadow 0.18s",
          position: "relative", overflow: "hidden",
        }}>
          {loading && (
            <div style={{ position:"absolute", inset:0, background:"rgba(13,15,26,0.6)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:20, height:20, border:`2px solid ${C.border}`, borderTop:`2px solid ${s.color}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
            </div>
          )}
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 10 }}>{s.label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</p>
          <p style={{ fontSize: 11, marginTop: 6, color: s.up ? C.green : C.muted }}>{s.change}</p>
        </div>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
