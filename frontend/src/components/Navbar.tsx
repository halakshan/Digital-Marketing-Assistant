"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "Marketplace"];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0a14]/95 backdrop-blur border-b border-white/10 shadow-lg" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">DM</div>
          <span className="text-lg font-bold tracking-tight">DM <span className="text-violet-400">Assistant</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-gray-300 hover:text-violet-400 transition-colors">
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white px-4 py-2 transition-colors">Login</Link>
          <Link href="/register"
            className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-violet-900/30">
            Get Started
          </Link>
        </div>

        <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0f0f1e] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-gray-300 hover:text-violet-400"
              onClick={() => setMenuOpen(false)}>
              {l}
            </a>
          ))}
          <Link href="/register"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm text-center">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}