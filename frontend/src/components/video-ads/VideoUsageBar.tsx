"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";

interface Props {
  firebaseUser: any;
  refresh: number;
}

export default function VideoUsageBar({ firebaseUser, refresh }: Props) {
  const router      = useRouter();
  const [usage,     setUsage]     = useState<number | null>(null);
  const [limit,     setLimit]     = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchUsage = async () => {
      setLoading(true);
      try {
        const token = await getIdToken(firebaseUser);
        const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsage(data.usage);
          setLimit(data.limit);
          setRemaining(data.remaining);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchUsage();
  }, [firebaseUser, refresh]);

  const pct   = usage !== null && limit !== null ? Math.min(100, (usage / limit) * 100) : 0;
  const label = usage === null ? "..." : `${usage} / ${limit ?? "∞"} used`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-200">Monthly Video Ads</h3>
        <span className={`text-xs font-bold ${usage !== null && limit !== null && usage >= limit ? "text-red-400" : "text-pink-400"}`}>
          {loading ? "..." : label}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-red-500" : "bg-gradient-to-r from-pink-500 to-rose-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {loading ? "Loading..." : (
          remaining !== null && remaining <= 0
            ? <span className="text-red-400">Limit reached. <span className="text-pink-400 cursor-pointer hover:text-pink-300" onClick={() => router.push("/dashboard/settings?tab=billing")}>Upgrade to Pro →</span></span>
            : <>{remaining ?? "Unlimited"} free video{remaining === 1 ? "" : "s"} remaining.{" "}
                <span className="text-pink-400 cursor-pointer hover:text-pink-300" onClick={() => router.push("/dashboard/settings?tab=billing")}>Upgrade for 5/month →</span>
              </>
        )}
      </p>
    </div>
  );
}
