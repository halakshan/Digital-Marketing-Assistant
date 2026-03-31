"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ActivityItem {
  id:     string;
  type:   string;
  title:  string;
  time:   string;
  status: string;
  icon:   string;
  ts:     number;
}

function statusStyle(s: string) {
  if (s === "completed" || s === "sent" || s === "connected") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (s === "active" || s === "scheduled")                    return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (s === "draft")                                          return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

function timeAgo(date: any): string {
  if (!date) return "";
  const d    = date?.toDate ? date.toDate() : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

function tsOf(date: any): number {
  if (!date) return 0;
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.getTime();
}

export default function RecentActivity({ uid }: { uid: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!uid) return;

    // Store docs per collection so any snapshot update can merge all together
    const snapData: Record<string, ActivityItem[]> = {
      ai_content:       [],
      ai_designs:       [],
      video_ads:        [],
      email_campaigns:  [],
      seo_analyses:     [],
      social_accounts:  [],
    };

    const rebuild = () => {
      const all = Object.values(snapData).flat();
      all.sort((a, b) => b.ts - a.ts);
      setActivities(all.slice(0, 8));
      setLoading(false);
    };

    const unsubs = [
      // AI Content
      onSnapshot(query(collection(db, "ai_content"), where("userId", "==", uid)), snap => {
        snapData.ai_content = snap.docs.map(doc => {
          const d = doc.data(), t = d.type || "post";
          return { id: doc.id, type: "AI Content",
            title:  d.prompt?.slice(0, 60) || "AI content generated",
            time:   timeAgo(d.createdAt), status: d.status || "completed",
            icon:   t === "caption" ? "✍️" : t === "ad" ? "📣" : "🤖",
            ts:     tsOf(d.createdAt) };
        });
        rebuild();
      }),

      // Post Designs
      onSnapshot(query(collection(db, "ai_designs"), where("userId", "==", uid)), snap => {
        snapData.ai_designs = snap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, type: "Post Design",
            title:  d.description?.slice(0, 60) || d.headline || d.templateName || "Post design created",
            time:   timeAgo(d.createdAt), status: d.status || "completed",
            icon:   "🎨", ts: tsOf(d.createdAt) };
        });
        rebuild();
      }),

      // Video Ads
      onSnapshot(query(collection(db, "video_ads"), where("userId", "==", uid)), snap => {
        snapData.video_ads = snap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, type: "Video Ad",
            title:  d.product?.slice(0, 60) || "Video ad generated",
            time:   timeAgo(d.createdAt),
            status: d.status === "prompt_ready" ? "completed" : d.status || "completed",
            icon:   "🎬", ts: tsOf(d.createdAt) };
        });
        rebuild();
      }),

      // Email Campaigns
      onSnapshot(query(collection(db, "email_campaigns"), where("userId", "==", uid)), snap => {
        snapData.email_campaigns = snap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, type: "Email Campaign",
            title:  d.name?.slice(0, 60) || d.subject?.slice(0, 60) || "Email campaign",
            time:   timeAgo(d.createdAt), status: d.status || "draft",
            icon:   "📧", ts: tsOf(d.createdAt) };
        });
        rebuild();
      }),

      // SEO Analyses
      onSnapshot(query(collection(db, "seo_analyses"), where("userId", "==", uid)), snap => {
        snapData.seo_analyses = snap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, type: "SEO Analysis",
            title:  d.url?.replace(/^https?:\/\//, "").slice(0, 60) || "SEO analysis",
            time:   timeAgo(d.createdAt), status: "completed",
            icon:   "📈", ts: tsOf(d.createdAt) };
        });
        rebuild();
      }),

      // Social Accounts
      onSnapshot(query(collection(db, "social_accounts"), where("userId", "==", uid)), snap => {
        snapData.social_accounts = snap.docs.map(doc => {
          const d = doc.data();
          const ts = d.connectedAt || d.updatedAt || d.createdAt;
          return { id: doc.id, type: "Social Account",
            title:  `${d.platform} — ${d.accountName || "account connected"}`,
            time:   timeAgo(ts), status: d.status || "connected",
            icon:   "📱", ts: tsOf(ts) };
        });
        rebuild();
      }),
    ];

    // Also refresh timestamps every minute so "2 min ago" stays accurate
    const ticker = setInterval(() => rebuild(), 60_000);

    return () => { unsubs.forEach(u => u()); clearInterval(ticker); };
  }, [uid]);

  return (
    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold">Recent Activity</h2>
        <span className="text-xs text-gray-500">{activities.length} items</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">No activity yet. Start using the tools!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] rounded-xl transition-all">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-base flex-shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{a.title}</div>
                <div className="text-xs text-gray-400">{a.type} · {a.time}</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${statusStyle(a.status)}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
