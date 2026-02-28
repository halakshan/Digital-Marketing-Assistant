"use client";

import Link from "next/link";
import NotificationBar from "@/components/NotificationBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FEATURES = [
  { icon: "🤖", title: "AI Content Generation", desc: "Generate social media posts, captions, and images in Sinhala, Tamil, and English instantly." },
  { icon: "🎬", title: "AI Video Ads", desc: "Produce professional video advertisements using Veo 3 with smart structured prompts." },
  { icon: "🎨", title: "Post Design (Canva)", desc: "Design stunning marketing posts directly via Canva API integration." },
  { icon: "🛒", title: "Website & Store", desc: "Build your eCommerce store and website effortlessly with Shopify API." },
  { icon: "📈", title: "SEO Analytics", desc: "Get actionable SEO insights and optimize your campaigns for better reach." },
  { icon: "👥", title: "Freelancer Marketplace", desc: "Hire designers, editors, developers, and influencers. Chat and pay — all in one place." },
  { icon: "📧", title: "Email Campaigns", desc: "Execute professional email marketing campaigns through built-in SMTP integration." },
  { icon: "🔔", title: "Real-Time Notifications", desc: "Stay updated on AI status, campaign performance, and freelancer messages instantly." },
];

const STEPS = [
  { step: "01", title: "Create Your Account", desc: "Sign up in seconds and set up your business profile." },
  { step: "02", title: "Generate AI Content", desc: "Enter your product details and let AI create posts, videos, and captions." },
  { step: "03", title: "Launch Campaigns", desc: "Schedule, publish, and monitor all your campaigns from one dashboard." },
  { step: "04", title: "Hire Freelancers", desc: "Browse the marketplace and hire creative talent as needed." },
];

const PLANS = [
  {
    name: "Starter", price: "Free", color: "from-slate-700 to-slate-800",
    features: ["3 AI Posts / month", "Basic SEO tools", "1 Social account", "Email support"],
  },
  {
    name: "Pro", price: "LKR 2,500", color: "from-violet-600 to-indigo-700", badge: "Most Popular",
    features: ["Unlimited AI Posts", "AI Video Ads (5/mo)", "Canva Integration", "Freelancer Access", "Advanced Analytics"],
  },
  {
    name: "Business", price: "LKR 5,500", color: "from-fuchsia-600 to-pink-700",
    features: ["Everything in Pro", "Shopify Integration", "Unlimited Video Ads", "Priority Support", "Custom AI Training"],
  },
];

const STATS = [
  { value: "10K+", label: "SMEs Onboarded" },
  { value: "3",    label: "Languages Supported" },
  { value: "50+",  label: "Freelancer Skills" },
  { value: "99%",  label: "Uptime Guarantee" },
];

const FREELANCERS = [
  { name: "Kasun P.",    role: "Graphic Designer", rate: "LKR 3,500/hr",  rating: "⭐ 4.9" },
  { name: "Dilini S.",   role: "Video Editor",     rate: "LKR 4,000/hr",  rating: "⭐ 4.8" },
  { name: "Tharindu R.", role: "Web Developer",    rate: "LKR 5,000/hr",  rating: "⭐ 5.0" },
  { name: "Amaya K.",    role: "Influencer",       rate: "LKR 2,000/post", rating: "⭐ 4.7" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white font-sans">

      <NotificationBar />

      <Navbar />

      <section className="relative overflow-hidden px-6 pt-24 pb-32 text-center max-w-5xl mx-auto">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full" />
        </div>

        <span className="inline-block bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs px-4 py-1.5 rounded-full mb-6 font-medium">
          🇱🇰 Built for Sri Lankan SMEs
        </span>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Your All-in-One<br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            AI Marketing
          </span>{" "}Platform
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Generate AI content, launch campaigns, run video ads, hire freelancers, and grow your
          business — all from a single intelligent dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/register"
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-xl shadow-violet-900/40">
            Start for Free →
          </Link>
          <button className="w-full sm:w-auto border border-white/15 hover:border-violet-500/50 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all">
            Watch Demo ▶
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 backdrop-blur">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-violet-400">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">Features</span>
          <h2 className="text-4xl font-bold mt-2">Everything You Need to Market Smarter</h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">Stop juggling 10 tools. DM Assistant brings it all together.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(f => (
            <div key={f.title}
              className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-base mb-2 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-bold mt-2">Launch in 4 Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-violet-500/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-xl font-extrabold mx-auto mb-4 shadow-lg shadow-violet-900/30">
                  {s.step}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl font-bold mt-2">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 mt-4">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map(p => (
            <div key={p.name} className={`relative bg-gradient-to-br ${p.color} rounded-2xl p-8 border border-white/10 shadow-xl`}>
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full">
                  {p.badge}
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <div className="text-3xl font-extrabold mb-6">
                {p.price}
                <span className="text-sm font-normal text-white/60">{p.price !== "Free" ? "/mo" : ""}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white/15 hover:bg-white/25 border border-white/20 py-2.5 rounded-xl font-semibold text-sm transition-all">
                {p.price === "Free" ? "Get Started Free" : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="marketplace" className="px-6 py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">Freelancer Marketplace</span>
            <h2 className="text-4xl font-bold mt-2 mb-6">Hire Sri Lanka&apos;s Best Creative Talent</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Find and hire graphic designers, video editors, web developers, photographers, and influencers.
              Chat, collaborate, and pay securely — all inside DM Assistant.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Graphic Designers", "Video Editors", "Web Developers", "Photographers", "Influencers"].map(t => (
                <span key={t} className="bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold text-sm transition-all">
              Explore Marketplace →
            </button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {FREELANCERS.map(f => (
              <div key={f.name} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-violet-500/40 transition-all">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm mb-3">
                  {f.name[0]}
                </div>
                <div className="font-semibold text-sm">{f.name}</div>
                <div className="text-violet-400 text-xs mb-1">{f.role}</div>
                <div className="text-gray-400 text-xs">{f.rate}</div>
                <div className="text-xs mt-1">{f.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-3xl px-8 py-16">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Transform Your Marketing?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of Sri Lankan businesses growing with AI.</p>
          <Link href="/register"
            className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-violet-900/40">
            Start for Free Today →
          </Link>
        </div>
      </section>

      <Footer />

    </div>
  );
}