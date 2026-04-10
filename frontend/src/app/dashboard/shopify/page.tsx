"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";

const FEATURES = [
  { icon: "🏪", title: "Store Setup",          desc: "Full Shopify store creation — theme, products, collections, and settings.",  color: "#22c55e" },
  { icon: "🎨", title: "Theme Customisation",   desc: "Custom Shopify theme design to match your brand identity perfectly.",        color: "#7c3aed" },
  { icon: "📦", title: "Product Listings",      desc: "Bulk product upload, descriptions, SEO tags, and variant setup.",           color: "#3b82f6" },
  { icon: "💳", title: "Payment Integration",   desc: "PayHere, Stripe, PayPal, COD — complete checkout configuration.",           color: "#f59e0b" },
  { icon: "📊", title: "Analytics & Reports",   desc: "Google Analytics, Facebook Pixel, Shopify reports setup.",                  color: "#ec4899" },
  { icon: "🚚", title: "Shipping & Delivery",   desc: "Shipping zones, rates, delivery tracking and fulfilment setup.",            color: "#8b5cf6" },
  { icon: "📱", title: "Mobile Optimisation",   desc: "Fully responsive store that looks great on every device.",                  color: "#14b8a6" },
  { icon: "🔌", title: "App Integrations",      desc: "WhatsApp chat, reviews, loyalty programs, upsell apps and more.",          color: "#f97316" },
];

const PLANS = [
  {
    name:  "Starter",
    price: "LKR 25,000",
    color: "#3b82f6",
    features: ["Basic theme setup", "Up to 20 products", "Payment gateway", "Mobile responsive", "1 revision"],
  },
  {
    name:  "Business",
    price: "LKR 55,000",
    color: "#7c3aed",
    popular: true,
    features: ["Custom theme design", "Unlimited products", "All payment methods", "Analytics setup", "Shipping config", "3 revisions"],
  },
  {
    name:  "Enterprise",
    price: "LKR 100,000+",
    color: "#22c55e",
    features: ["Full custom development", "Advanced integrations", "SEO optimisation", "WhatsApp & CRM", "Priority support", "Unlimited revisions"],
  },
];

export default function ShopifyPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,    setUserName]    = useState("User");
  const [userInitial, setUserInitial] = useState("U");
  const [userPhoto,   setUserPhoto]   = useState("");
  const [userPlan,    setUserPlan]    = useState("Free Plan");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("Shopify Store");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const name = d.fullName || user.displayName || "User";
        setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
        setUserPhoto(d.profilePhoto || user.photoURL || "");
        setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden text-white">
      <Sidebar sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan} isFreelancer={isFreelancer}/>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}/>
        <main className="flex-1 overflow-y-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl">🛍️</div>
              <div>
                <h1 className="text-2xl font-bold">Shopify Store</h1>
                <p className="text-sm text-gray-400">Launch your online store with expert Shopify developers</p>
              </div>
            </div>
          </div>

          {/* Hero banner */}
          <div className="bg-gradient-to-r from-green-600/20 via-emerald-600/15 to-teal-600/20 border border-green-500/30 rounded-2xl p-6 mb-8 flex items-center gap-6 flex-wrap">
            <div className="text-5xl">🛒</div>
            <div className="flex-1 min-w-48">
              <h2 className="text-lg font-bold mb-1">Build Your Online Store Today</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Hire expert Shopify developers from our Marketplace to create a fully functional, beautiful online store tailored to your business.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/marketplace")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex-shrink-0"
            >
              Hire a Developer →
            </button>
          </div>

          {/* Features grid */}
          <h2 className="text-base font-bold mb-4">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                  style={{ background: f.color + "22", border: `1px solid ${f.color}44` }}>
                  {f.icon}
                </div>
                <p className="text-sm font-semibold mb-1">{f.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing plans */}
          <h2 className="text-base font-bold mb-4">Typical Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {PLANS.map(p => (
              <div key={p.name} className={`relative bg-white/5 border rounded-2xl p-6 transition-all ${p.popular ? "border-violet-500/50 bg-violet-500/5" : "border-white/10"}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-300 mb-1">{p.name}</p>
                  <p className="text-2xl font-bold" style={{ color: p.color }}>{p.price}</p>
                  <p className="text-xs text-gray-500 mt-0.5">typical market rate</p>
                </div>
                <ul className="space-y-2 mb-5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span style={{ color: p.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push("/dashboard/marketplace")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all border"
                  style={{ borderColor: p.color + "60", color: p.color, background: p.color + "15" }}
                >
                  Find a Developer →
                </button>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
            💡 <strong className="text-gray-300">Note:</strong> Prices shown are typical market rates. Actual quotes depend on the freelancer you hire. Use the Marketplace to browse developers, compare profiles, and send a hire request.
          </div>

        </main>
      </div>
    </div>
  );
}
