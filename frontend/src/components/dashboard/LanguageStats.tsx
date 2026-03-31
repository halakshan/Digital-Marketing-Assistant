"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

const LANG_COLORS: Record<string, string> = {
  English: "bg-violet-500",
  Sinhala: "bg-indigo-500",
  Tamil:   "bg-pink-500",
};

interface LangStat {
  lang:  string;
  count: number;
  pct:   number;
  color: string;
}

export default function LanguageStats() {
  const [stats,   setStats]   = useState<LangStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const snap = await getDocs(
          query(collection(db, "ai_content"), where("userId", "==", user.uid))
        );

        const counts: Record<string, number> = { English: 0, Sinhala: 0, Tamil: 0 };
        snap.docs.forEach(doc => {
          const lang = doc.data().language || "English";
          const key  = lang in counts ? lang : "English";
          counts[key]++;
        });

        const tot = Object.values(counts).reduce((a, b) => a + b, 0);
        setTotal(tot);

        const result: LangStat[] = Object.entries(counts).map(([lang, count]) => ({
          lang,
          count,
          pct:   tot > 0 ? Math.round((count / tot) * 100) : 0,
          color: LANG_COLORS[lang] || "bg-gray-500",
        }));

        setStats(result);
      } catch (err) {
        console.error("LanguageStats fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-base font-bold mb-5">AI Content by Language</h2>
        <div className="grid grid-cols-3 gap-6">
          {["English", "Sinhala", "Tamil"].map(l => (
            <div key={l} className="text-center">
              <div className="h-8 w-12 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse mx-auto mb-3" />
              <div className="h-2 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-base font-bold mb-5">AI Content by Language</h2>
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-xs">No AI content yet. Start generating posts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold">AI Content by Language</h2>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {stats.map(l => (
          <div key={l.lang} className="text-center">
            <div className="text-2xl font-extrabold text-white mb-1">{l.count}</div>
            <div className="text-xs text-gray-400 mb-3">{l.lang} posts</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${l.color} rounded-full transition-all`}
                style={{ width: `${l.pct}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{l.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
