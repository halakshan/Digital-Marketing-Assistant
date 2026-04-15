"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const PLANS = [
  {
    key:      "free",
    name:     "Starter",
    price:    "Free",
    features: ["3 AI Posts/month", "1 Video Ad/month", "Basic SEO Tools", "Email Support"],
    color:    "from-slate-600 to-slate-700",
    border:   "border-slate-500/30",
  },
  {
    key:      "pro",
    name:     "Pro",
    price:    "LKR 2,500/mo",
    features: ["Unlimited AI Posts", "5 Video Ads/month", "Canva Integration", "Advanced Analytics", "Freelancer Access"],
    color:    "from-violet-600 to-indigo-700",
    border:   "border-violet-500/30",
    badge:    "Most Popular",
  },
  {
    key:      "business",
    name:     "Business",
    price:    "LKR 5,500/mo",
    features: ["Everything in Pro", "Shopify Integration", "Unlimited Video Ads", "Priority Support", "Custom AI Training"],
    color:    "from-fuchsia-600 to-pink-700",
    border:   "border-fuchsia-500/30",
  },
];

const LIMITS: Record<string, number | null> = { free: 3, pro: null, business: null };

export default function BillingTab() {
  const [plan,        setPlan]        = useState<string>("free");
  const [aiUsed,      setAiUsed]      = useState(0);
  const [videoUsed,   setVideoUsed]   = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        // Get user plan
        const snap = await getDoc(doc(db, "users", user.uid));
        const userPlan = snap.exists() ? (snap.data().plan || "free") : "free";
        setPlan(userPlan);

        // Count this month's AI posts
        const start = new Date();
        start.setDate(1); start.setHours(0, 0, 0, 0);

        const [aiSnap, videoSnap] = await Promise.all([
          getDocs(query(collection(db, "ai_content"),  where("userId", "==", user.uid))),
          getDocs(query(collection(db, "video_ads"),   where("userId", "==", user.uid))),
        ]);

        const monthlyAi = aiSnap.docs.filter(d => {
          const ts = d.data().createdAt;
          const date = ts?.toDate ? ts.toDate() : new Date(ts);
          return date >= start;
        }).length;

        const monthlyVideo = videoSnap.docs.filter(d => {
          const ts = d.data().createdAt;
          const date = ts?.toDate ? ts.toDate() : new Date(ts);
          return date >= start;
        }).length;

        setAiUsed(monthlyAi);
        setVideoUsed(monthlyVideo);
      } catch (err) {
        console.error("BillingTab fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const currentPlan = PLANS.find(p => p.key === plan) || PLANS[0];
  const aiLimit     = LIMITS[plan];
  const videoLimit  = plan === "free" ? 1 : plan === "pro" ? 5 : null;

  return (
    <div className="space-y-5">

      {/* Current Plan */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-bold mb-4">Current Plan</h3>

        {loading ? (
          <div className="p-4 bg-white/5 rounded-xl animate-pulse h-20 mb-5" />
        ) : (
          <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r ${currentPlan.color} bg-opacity-20 border ${currentPlan.border} rounded-xl mb-5`}>
            <div className="flex-1">
              <div className="text-lg font-extrabold">{currentPlan.name} Plan</div>
              <div className="text-sm text-white/60">
                {plan === "free" ? "Free · No expiry" : `${currentPlan.price} · Monthly billing`}
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-xs text-white/60">AI Posts this month</div>
                <div className="text-sm font-bold text-violet-300">
                  {aiUsed}{aiLimit !== null ? ` / ${aiLimit}` : " / ∞"}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60">Video Ads this month</div>
                <div className="text-sm font-bold text-pink-300">
                  {videoUsed}{videoLimit !== null ? ` / ${videoLimit}` : " / ∞"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage bars (Free plan only) */}
        {plan === "free" && !loading && (
          <div className="space-y-3 mb-5">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>AI Posts</span>
                <span>{aiUsed} / 3 used</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${aiUsed >= 3 ? "bg-red-500" : "bg-violet-500"}`}
                  style={{ width: `${Math.min(100, (aiUsed / 3) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Video Ads</span>
                <span>{videoUsed} / 1 used</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${videoUsed >= 1 ? "bg-red-500" : "bg-pink-500"}`}
                  style={{ width: `${Math.min(100, (videoUsed / 1) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const isCurrent = p.key === plan;
            return (
              <div key={p.key} className={`relative bg-gradient-to-br ${p.color} border ${p.border} rounded-2xl p-5`}>
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-0.5 rounded-full">
                    {p.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute top-2 right-2 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ Active
                  </span>
                )}
                <div className="text-base font-bold mb-1">{p.name}</div>
                <div className="text-xl font-extrabold mb-4">{p.price}</div>
                <ul className="space-y-1.5 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="text-xs text-white/80 flex items-center gap-1.5">
                      <span className="text-green-400">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button type="button"
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                    isCurrent
                      ? "bg-white/10 border-white/20 text-white/60 cursor-default"
                      : "bg-white/15 hover:bg-white/25 border-white/20 cursor-pointer"
                  }`}>
                  {isCurrent ? "Current Plan" : "Upgrade →"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-bold mb-4">Recent Invoices</h3>
        <div className="text-sm text-gray-400 text-center py-8">
          {plan === "free"
            ? "No invoices yet. Upgrade to a paid plan to see invoices here."
            : "Invoices will appear here after each billing cycle."}
        </div>
      </div>
    </div>
  );
}
