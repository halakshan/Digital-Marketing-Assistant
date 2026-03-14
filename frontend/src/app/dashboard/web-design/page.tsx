"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";

const DEV_SERVICES = [
  { icon: "🎨", title: "Landing Page",      desc: "High-converting single-page design for products or campaigns.", tag: "Popular",  color: "#3b82f6" },
  { icon: "🖥️", title: "Business Website",  desc: "Full multi-page website with modern UI and responsive layout.", tag: "Full Site", color: "#3b82f6" },
  { icon: "🛒", title: "E-Commerce Design", desc: "Product pages, cart and checkout — complete online store UI.",   tag: "Store",    color: "#3b82f6" },
  { icon: "📐", title: "UI/UX Prototyping", desc: "Figma / Adobe XD wireframes and prototypes before development.", tag: "Design",   color: "#3b82f6" },
  { icon: "📱", title: "Mobile App Design", desc: "iOS & Android screen design with interactive mockups.",           tag: "Mobile",   color: "#3b82f6" },
  { icon: "🔄", title: "Website Redesign",  desc: "Refresh your existing site with a modern, professional look.",   tag: "Revamp",   color: "#3b82f6" },
];

const PACKAGES = [
  {
    name: "Starter",
    price: "LKR 15,000",
    color: "#3b82f6",
    features: ["Landing page design", "Mobile responsive", "2 revisions", "Delivery in 5 days"],
  },
  {
    name: "Business",
    price: "LKR 45,000",
    color: "#7c3aed",
    popular: true,
    features: ["Up to 5 pages", "Custom UI design", "SEO optimised", "Contact form", "3 revisions"],
  },
  {
    name: "Enterprise",
    price: "LKR 90,000+",
    color: "#22c55e",
    features: ["Full custom build", "E-commerce ready", "CMS integration", "Analytics setup", "Unlimited revisions"],
  },
];

export default function WebDesignPage() {
  const router = useRouter();

  /* ── auth ── */
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer   = useIsFreelancer(firebaseUser?.uid);
  const [userEmail,    setUserEmail]    = useState("");
  const [userName,     setUserName]     = useState("User");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeLink,   setActiveLink]   = useState("Web Design");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      setUserEmail(user.email || "");
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d    = snap.data();
        const name = d.fullName || user.displayName || "User";
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
        setUserPhoto(d.profilePhoto || user.photoURL || "");
        setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
        if (d.email) setUserEmail(d.email);
      }
    });
    return () => unsub();
  }, [router]);

  /* ── open Shopify pre-filled with user email ── */
  const openShopify = () => {
    const base = "https://accounts.shopify.com/signup";
    const url  = userEmail
      ? `${base}?email=${encodeURIComponent(userEmail)}`
      : base;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden text-white">
      <Sidebar
        sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        userPlan={userPlan} isFreelancer={isFreelancer}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8">

          {/* ── Page header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xl">🌐</div>
              <div>
                <h1 className="text-2xl font-bold">Web Design</h1>
                <p className="text-sm text-gray-400">Build your online store or hire a developer</p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              PART 1 — Shopify Store Builder
          ════════════════════════════════════════════════════════ */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-green-400 to-emerald-600 inline-block"/>
              <h2 className="text-base font-bold">Shopify Store Builder</h2>
            </div>

            {/* Main Shopify card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2e1a] via-[#0d1f14] to-[#0a1a10] border border-green-500/30 rounded-2xl p-7 mb-5 flex flex-col md:flex-row items-center gap-7">
              {/* glow blob */}
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-green-500/10 rounded-full blur-3xl pointer-events-none"/>

              {/* Shopify logo mark */}
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-[#96bf48]/15 border border-[#96bf48]/30 flex items-center justify-center">
                <svg viewBox="0 0 109.5 124.5" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M74.7 14.8s-.3.1-.7.2c-.4-1.2-1-2.6-1.8-4-2.6-5-6.5-7.6-11.2-7.6-.3 0-.6 0-1 .1-.1-.2-.3-.3-.4-.5-2.1-2.3-4.8-3.3-8.1-3.2-6.3.2-12.5 4.7-17.6 12.8C30.3 18 27.1 25 26.2 30.4l-13.5 4.2c-4 1.2-4.1 1.3-4.6 5L3 98.2l72.7 13.6 39.3-9.5L98.7 12.5l-24 2.3zm-15 4.6c-4.2 1.3-8.8 2.7-13.3 4.1 1.3-4.9 3.7-9.7 6.7-12.9 1.1-1.2 2.6-2.5 4.4-3.3 1.7 3.6 2.2 8.6 2.2 12.1zm-8.4-13.9c1.4 0 2.6.3 3.6.9-1.6.8-3.2 2.1-4.7 3.6-3.8 4.1-6.8 10.4-8 16.5-3.7 1.2-7.4 2.3-10.8 3.3 2-10.6 9.7-24 19.9-24.3zm4.6 55.2c.4 6.3 17 7.7 18 22.1.7 11.5-6.1 19.3-15.9 19.9-11.8.7-18.3-6.2-18.3-6.2l2.5-10.6s6.5 4.9 11.7 4.6c3.4-.2 4.6-3 4.5-5-.5-8.2-14-7.7-14.9-20.9C42.8 53 50.3 41.8 64.3 41s20.9 7.4 20.9 7.4L81.9 57.4s-5.7-4.2-12.5-3.8c-9.9.6-10.5 6.9-10.5 7.1zm19-41.6c-.1-3.1-.5-7.7-2.1-11.5 5.4 1 8 7.1 9.1 10.8l-7 .7z" fill="#96bf48"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">Launch with Shopify</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">Recommended</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  The world's leading e-commerce platform. Create your online store, add products, accept payments and start selling in minutes — no coding needed.
                </p>
                <div className="flex flex-wrap gap-3 mb-5">
                  {["Free 3-day trial", "100+ themes", "Built-in payments", "Mobile ready", "24/7 support"].map(f => (
                    <span key={f} className="text-xs text-green-300 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">✓ {f}</span>
                  ))}
                </div>
                <button
                  onClick={openShopify}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-green-900/30"
                >
                  Open Shopify
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </button>
                {userEmail && (
                  <p className="text-xs text-gray-500 mt-2">
                    Your account email <span className="text-gray-400">{userEmail}</span> will be pre-filled on Shopify
                  </p>
                )}
              </div>
            </div>

            {/* Shopify feature mini-cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon:"🏪", title:"Store Setup",       desc:"Build your store from 100+ themes" },
                { icon:"💳", title:"Payment Gateway",    desc:"Shopify Payments, PayPal & more"   },
                { icon:"📦", title:"Inventory Manager",  desc:"Track stock across all channels"   },
                { icon:"📊", title:"Built-in Analytics", desc:"Sales reports and customer data"   },
              ].map(f => (
                <div key={f.title} className="bg-white/4 border border-white/8 rounded-xl p-4 hover:border-green-500/25 transition-all">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-xs font-semibold mb-0.5">{f.title}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-white/8"/>
            <span className="text-xs text-gray-600 font-semibold uppercase tracking-widest px-2">or</span>
            <div className="flex-1 h-px bg-white/8"/>
          </div>

          {/* ════════════════════════════════════════════════════════
              PART 2 — Hire a Developer
          ════════════════════════════════════════════════════════ */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-blue-600 inline-block"/>
              <h2 className="text-base font-bold">Hire a Web Developer</h2>
            </div>

            {/* Hero hire banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#14102e] via-[#0f0d24] to-[#0a0a1e] border border-violet-500/30 rounded-2xl p-7 mb-6 flex flex-col md:flex-row items-center gap-7">
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"/>
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-5xl">👨‍💻</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-2">Work with Expert Developers</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">
                  Browse skilled web developers and designers from our Marketplace. Share your vision, get custom quotes, and launch your site — all managed from one place.
                </p>
                <button
                  onClick={() => router.push("/dashboard/marketplace")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-violet-900/30"
                >
                  Browse Developers
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </button>
              </div>
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {DEV_SERVICES.map(s => (
                <div
                  key={s.title}
                  onClick={() => router.push("/dashboard/marketplace")}
                  className="bg-white/5 border border-white/10 hover:border-violet-500/35 hover:bg-white/8 rounded-2xl p-5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: s.color + "22", border: `1px solid ${s.color}44` }}>
                      {s.icon}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: s.color + "22", color: s.color }}>
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 group-hover:text-violet-300 transition-colors">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{s.desc}</p>
                  <span className="text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
                    Find a Developer →
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <h3 className="text-sm font-bold mb-4 text-gray-300">Typical Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PACKAGES.map(p => (
                <div
                  key={p.name}
                  className={`relative bg-white/5 border rounded-2xl p-5 transition-all ${p.popular ? "border-violet-500/50 bg-violet-500/5" : "border-white/10"}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-300 mb-1">{p.name}</p>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: p.color }}>{p.price}</p>
                  <p className="text-xs text-gray-500 mb-4">typical market rate</p>
                  <ul className="space-y-2 mb-5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                        <span style={{ color: p.color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push("/dashboard/marketplace")}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all border"
                    style={{ borderColor: p.color + "60", color: p.color, background: p.color + "15" }}
                  >
                    Find a Developer →
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-4 leading-relaxed">
              💡 Prices shown are typical market rates. Actual quotes depend on the freelancer you hire. Use the Marketplace to browse developers, compare profiles, and send a hire request.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
