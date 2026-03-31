"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";

interface Design {
  id: string;
  type: string;
  description: string;
  templateName: string;
  imageUrl: string | null;
  platform: string;
  style: string;
  status: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  ai_image:  "🤖",
  template:  "🎨",
  custom:    "✏️",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

interface Props {
  firebaseUser: any;
  refresh: number;
}

export default function RecentDesigns({ firebaseUser, refresh }: Props) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = await getIdToken(firebaseUser);
        const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/design/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDesigns(data.history || []);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [firebaseUser, refresh]);

  const handleOpen = (d: Design) => {
    if (d.imageUrl) window.open(d.imageUrl, "_blank");
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-200">Recent Designs</h3>
        <span className="text-xs text-gray-400">{designs.length} total</span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && designs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🎨</div>
          <p className="text-xs">No designs yet. Create your first post!</p>
        </div>
      )}

      {/* List */}
      {!loading && designs.length > 0 && (
        <div className="space-y-3">
          {designs.map(d => (
            <div key={d.id}
              onClick={() => handleOpen(d)}
              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] rounded-xl transition-all group cursor-pointer">

              {/* Icon / Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {d.imageUrl
                  ? <img src={d.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-2xl">{TYPE_ICONS[d.type] ?? "🎨"}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {d.type === "ai_image" ? d.description : d.templateName}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 capitalize">
                  {d.platform || d.style || "custom"}
                  {d.type === "ai_image" ? " · AI Generated" : " · Template"}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{timeAgo(d.createdAt)}</div>
              </div>

              {/* Action */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-violet-500/15 text-violet-400 border-violet-500/30">
                  {d.type === "ai_image" ? "AI Image" : "Template"}
                </span>
                <span className="text-xs text-gray-600 group-hover:text-white transition-colors">
                  {d.imageUrl ? "🖼️ view" : "🎨 design"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
