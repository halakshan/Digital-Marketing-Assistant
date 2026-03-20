"use client";

import { useState, useEffect } from "react";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface HistoryItem {
  id:        string;
  type:      string;
  language:  string;
  platform:  string;
  prompt:    string;
  output:    string;
  createdAt: any;
}

function timeAgo(date: any): string {
  if (!date) return "";
  const now  = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60)        return "Just now";
  if (diff < 3600)      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 2) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    post: "Social Post", caption: "Caption", ad: "Ad Copy",
    email: "Email", hashtags: "Hashtags", bio: "Bio",
  };
  return map[type] || type;
}

export default function ContentHistory() {
  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const token    = await getIdToken(user);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) setHistory(data.history);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-200">Recent Generations</h3>
        <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          View all →
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🤖</div>
          <p className="text-xs">No generations yet. Create your first AI content!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id}
              className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-white">{typeLabel(h.type)}</span>
                  <span className="text-xs bg-pink-500/15 text-pink-300 px-1.5 py-0.5 rounded">{h.language}</span>
                  <span className="text-xs bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded">{h.platform}</span>
                </div>
                <div className="text-xs text-gray-400 truncate">{h.prompt}</div>
                <div className="text-xs text-gray-600 mt-1">{timeAgo(h.createdAt)}</div>
              </div>
              <button type="button"
                onClick={() => handleCopy(h.output, h.id)}
                className="text-xs text-gray-500 group-hover:text-violet-400 transition-colors flex-shrink-0">
                {copied === h.id ? "✓" : "📋"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
