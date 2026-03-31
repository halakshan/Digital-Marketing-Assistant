"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const PLANS = [
  {
    key:      "free",
    name:     "Free",
    price:    "LKR 0",
    per:      "forever",
    icon:     "🌱",
    color:    "#64748b",
    grad:     "from-slate-600 to-slate-700",
    features: [
      "3 AI content generations/month",
      "3 video ad scripts/month",
      "3 post designs/month",
      "3 SEO analyses/month",
      "Basic email campaigns",
      "1 social account",
      "Marketplace access",
    ],
  },
  {
    key:      "pro",
    name:     "Pro",
    price:    "LKR 2,900",
    per:      "per month",
    icon:     "⚡",
    color:    "#7c3aed",
    grad:     "from-violet-600 to-indigo-600",
    popular:  true,
    features: [
      "100 AI content generations/month",
      "50 video ad scripts/month",
      "50 post designs/month",
      "30 SEO analyses/month",
      "Advanced email campaigns",
      "5 social accounts",
      "Priority marketplace listing",
      "Analytics dashboard",
      "Email support",
    ],
  },
  {
    key:      "business",
    name:     "Business",
    price:    "LKR 7,900",
    per:      "per month",
    icon:     "🏢",
    color:    "#f59e0b",
    grad:     "from-amber-500 to-orange-600",
    features: [
      "Unlimited AI content",
      "Unlimited video ad scripts",
      "Unlimited post designs",
      "Unlimited SEO analyses",
      "Bulk email campaigns",
      "Unlimited social accounts",
      "Top marketplace placement",
      "White-label reports",
      "Shopify integration",
      "Dedicated account manager",
      "Priority phone support",
    ],
  },
];

const PLAN_ORDER = ["free", "pro", "business"];

export default function UpgradePage() {
  const router = useRouter();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userName,     setUserName]     = useState("User");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("free");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [authLoading,  setAuthLoading]  = useState(true);

  // ── Upgrade state ────────────────────────────────────────────────────────────
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setFirebaseUser(u);

      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data     = snap.data();
        const name     = data.fullName || u.displayName || "User";
        const photo    = data.profilePhoto || u.photoURL || "";
        const plan     = data.plan || "free";
        setUserName(name);
        setUserInitial(name.trim().charAt(0).toUpperCase());
        setUserPhoto(photo);
        setUserPlan(plan);
      } else {
        const name = u.displayName || "User";
        setUserName(name);
        setUserInitial(name.trim().charAt(0).toUpperCase());
        setUserPhoto(u.photoURL || "");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === userPlan || !firebaseUser) return;
    setUpgrading(planKey);
    try {
      const token = await getIdToken(firebaseUser);
      const res   = await fetch(`${API}/users/upgrade-plan`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (res.ok && data.success) {
        setUserPlan(planKey);
        showToast(`✅ Upgraded to ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}!`);
      } else {
        showToast("💬 Contact support@dmassistant.lk to upgrade.", true);
      }
    } catch {
      showToast("Please contact support@dmassistant.lk to upgrade.", true);
    } finally {
      setUpgrading(null);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeLink="Upgrade Plan"
        setActiveLink={() => {}}
        userName={userName}
        userInitial={userInitial}
        userPhoto={userPhoto}
        userPlan={`${userPlan.charAt(0).toUpperCase()}${userPlan.slice(1)} Plan`}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          userName={userName}
          userInitial={userInitial}
          userPhoto={userPhoto}
        />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">

            {/* Toast */}
            {toast && (
              <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border max-w-sm ${
                toast.ok
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-red-500/20 border-red-500/40 text-red-300"
              }`}>
                {toast.msg}
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                ⚡ Upgrade Your Plan
              </div>
              <h1 className="text-3xl font-extrabold mb-3">Choose the right plan for you</h1>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                Unlock more AI generations, social accounts and premium features. Cancel anytime.
              </p>
            </div>

            {/* Current plan badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm">
                <span className="text-gray-400">Current plan:</span>
                <span className="font-bold text-violet-400 capitalize">{userPlan}</span>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {PLANS.map(plan => {
                const isCurrent  = plan.key === userPlan;
                const isUpgrade  = PLAN_ORDER.indexOf(userPlan) < PLAN_ORDER.indexOf(plan.key);
                const isLoading  = upgrading === plan.key;

                return (
                  <div key={plan.key} className={`relative bg-white/5 border rounded-2xl overflow-hidden transition-all ${
                    plan.popular ? "border-violet-500/50 shadow-lg shadow-violet-500/10 scale-[1.02]" : "border-white/10"
                  } ${isCurrent ? "ring-2 ring-green-500/40" : ""}`}>

                    {plan.popular && !isCurrent && (
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold text-center py-1.5 tracking-wide">
                        ✨ MOST POPULAR
                      </div>
                    )}
                    {isCurrent && (
                      <div className="bg-green-500/20 text-green-400 text-xs font-bold text-center py-1.5 border-b border-green-500/20">
                        ✓ YOUR CURRENT PLAN
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.grad} flex items-center justify-center text-2xl`}>
                          {plan.icon}
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold">{plan.name}</h2>
                          <p className="text-xs text-gray-400">{plan.per}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <span className="text-3xl font-extrabold" style={{ color: plan.color }}>
                          {plan.price}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">/mo</span>
                      </div>

                      <ul className="space-y-2.5 mb-6">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                            <span className="text-gray-300">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={isCurrent || isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          isCurrent
                            ? "bg-green-500/15 border border-green-500/30 text-green-400 cursor-default"
                            : isUpgrade
                              ? `bg-gradient-to-r ${plan.grad} hover:opacity-90 active:scale-95 text-white shadow-lg`
                              : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/25"
                        } disabled:opacity-60`}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Processing...
                          </span>
                        ) : isCurrent   ? "Current Plan"
                          : isUpgrade   ? `Upgrade to ${plan.name} →`
                          :               `Downgrade to ${plan.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info strip */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: "🔒", title: "Secure Payments",   desc: "All payments processed securely via Stripe." },
                { icon: "❌", title: "Cancel Anytime",    desc: "No long-term contracts. Cancel with one click." },
                { icon: "📞", title: "Dedicated Support", desc: "Get help at support@dmassistant.lk" },
              ].map(f => (
                <div key={f.title} className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{f.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold mb-1">Need a custom plan for your team?</p>
              <p className="text-xs text-gray-400 mb-3">Get a tailored quote for agencies and large businesses.</p>
              <a href="mailto:support@dmassistant.lk"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
                📧 Contact Sales
              </a>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
