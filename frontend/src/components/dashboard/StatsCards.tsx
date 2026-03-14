"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";

const CARD_STYLES = [
  { label: "AI Posts Generated",  icon: "🤖", color: "from-indigo-500/20 to-indigo-600/5", border: "border-indigo-500/30", text: "text-indigo-400" },
  { label: "Active Ad Campaigns", icon: "📣", color: "from-indigo-500/20 to-indigo-600/5", border: "border-indigo-500/30", text: "text-indigo-400" },
  { label: "Social Accounts",     icon: "📱", color: "from-indigo-500/20 to-indigo-600/5", border: "border-indigo-500/30", text: "text-indigo-400" },
  { label: "Email Campaigns",     icon: "📧", color: "from-indigo-500/20 to-indigo-600/5", border: "border-indigo-500/30", text: "text-indigo-400" },
];

export default function StatsCards({ uid }: { uid: string }) {
  const [counts,  setCounts]  = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchCounts = async () => {
      setLoading(true);
      try {
        // AI Posts — getCountFromServer on ai_content where userId == uid
        const aiQuery      = query(collection(db, "ai_content"),      where("userId", "==", uid));
        const socialQuery  = query(collection(db, "social_accounts"), where("userId", "==", uid));
        const emailQuery   = query(collection(db, "email_campaigns"), where("userId", "==", uid));

        // Active Campaigns — fetch all for uid, filter in-memory by status === "active"
        const adsQuery = query(collection(db, "ad_campaigns"), where("userId", "==", uid));

        const [aiSnap, socialSnap, emailSnap, adsSnap] = await Promise.all([
          getCountFromServer(aiQuery),
          getCountFromServer(socialQuery),
          getCountFromServer(emailQuery),
          getDocs(adsQuery),
        ]);

        const activeCampaigns = adsSnap.docs.filter(d => d.data().status === "active").length;

        setCounts([
          aiSnap.data().count,
          activeCampaigns,
          socialSnap.data().count,
          emailSnap.data().count,
        ]);
      } catch (err) {
        console.error("StatsCards fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [uid]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARD_STYLES.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <div className="h-6 w-20 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="h-9 w-16 bg-white/10 rounded-lg animate-pulse mb-2" />
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARD_STYLES.map((s, i) => (
        <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 transition-all hover:-translate-y-1`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{s.icon}</span>
            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">Live</span>
          </div>
          <div className={`text-3xl font-extrabold ${s.text}`}>{counts[i]}</div>
          <div className="text-xs text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
