"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { statusStyle } from "./videoAdsData";

interface VideoJob {
  id: string;
  product: string;
  platform: string;
  language: string;
  duration: string;
  adStyle: string;
  status: string;
  videoUrl: string | null;
  script: string;
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram_reels: "📸",
  facebook:        "👍",
  youtube:         "▶️",
  tiktok:          "🎵",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

interface Props {
  firebaseUser: any;
  refresh: number;
}

export default function RecentVideos({ firebaseUser, refresh }: Props) {
  const [videos,  setVideos]  = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = await getIdToken(firebaseUser);
        const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data.history || []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [firebaseUser, refresh]);

  const handleDownload = (v: VideoJob) => {
    if (v.videoUrl) { window.open(v.videoUrl, "_blank"); return; }
    // Download script as .txt
    const blob = new Blob([v.script || ""], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${v.product.substring(0, 20).replace(/\s+/g, "-")}-script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-200">Recent Video Ads</h3>
        <span className="text-xs text-pink-400">{videos.length} total</span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🎬</div>
          <p className="text-xs">No video ads yet. Create your first!</p>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map(v => (
            <div key={v.id}
              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] rounded-xl transition-all group cursor-pointer"
              onClick={() => handleDownload(v)}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/30 to-rose-600/30 border border-pink-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                {PLATFORM_ICONS[v.platform] || "🎬"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{v.product}</div>
                <div className="text-xs text-gray-400 mt-0.5 capitalize">
                  {v.platform?.replace(/_/g, " ")} · {v.duration} · {v.language}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{timeAgo(v.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle(v.status)}`}>
                  {v.status === "prompt_ready" ? "script ready" : v.status}
                </span>
                <span className="text-xs text-gray-600 group-hover:text-pink-400 transition-colors">
                  {v.videoUrl ? "⬇️ video" : "📄 script"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
