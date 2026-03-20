"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function UsageBar() {
  const router      = useRouter();
  const [usage,     setUsage]     = useState(0);
  const [limit,     setLimit]     = useState<number | null>(3);
  const [plan,      setPlan]      = useState("free");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const token    = await getIdToken(user);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUsage(data.usage);
          setLimit(data.limit);
          setPlan(data.plan);
        }
      } catch (err) {
        console.error("Failed to fetch usage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const isUnlimited = limit === null;
  const pct         = isUnlimited ? 0 : Math.min((usage / (limit || 3)) * 100, 100);
  const remaining   = isUnlimited ? null : Math.max(0, (limit || 3) - usage);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border border-violet-500/25 rounded-2xl px-5 py-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-2 bg-white/10 rounded mb-2" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border border-violet-500/25 rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Monthly AI Posts</span>
        <span className="text-xs text-violet-400 font-bold">
          {isUnlimited ? `${usage} used (Unlimited)` : `${usage} / ${limit} used`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 100 ? "bg-red-500" : pct >= 66 ? "bg-yellow-500" : "bg-gradient-to-r from-violet-500 to-indigo-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <p className="text-xs text-gray-400">
        {isUnlimited ? (
          <span className="text-green-400 font-semibold">✓ Unlimited posts — {plan} plan</span>
        ) : remaining === 0 ? (
          <span className="text-red-400 font-semibold">
            Limit reached.{" "}
            <span className="text-violet-400 cursor-pointer hover:text-violet-300" onClick={() => router.push("/dashboard/settings?tab=billing")}>Upgrade for unlimited →</span>
          </span>
        ) : (
          <>
            {remaining} free {remaining === 1 ? "post" : "posts"} remaining.{" "}
            <span className="text-violet-400 cursor-pointer hover:text-violet-300" onClick={() => router.push("/dashboard/settings?tab=billing")}>Upgrade for unlimited →</span>
          </>
        )}
      </p>
    </div>
  );
}
