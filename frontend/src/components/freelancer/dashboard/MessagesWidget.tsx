"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

const GRADS = [
  "linear-gradient(135deg,#7c3aed,#3b82f6)",
  "linear-gradient(135deg,#059669,#0284c7)",
  "linear-gradient(135deg,#d97706,#dc2626)",
  "linear-gradient(135deg,#db2777,#9333ea)",
  "linear-gradient(135deg,#0891b2,#059669)",
];

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440)return `${Math.floor(mins/60)}h ago`;
  return `${Math.floor(mins/1440)}d ago`;
}

export default function MessagesWidget() {
  const router = useRouter();
  const { uid } = useFreelancerUser();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db,"hire_requests"), where("freelancerUid","==",uid));
    const unsub = onSnapshot(q, snap => {
      // Group by clientUid, keep latest message per client
      const map = new Map<string, any>();
      snap.docs.forEach(d => {
        const data = d.data();
        const key  = data.clientUid;
        const existing = map.get(key);
        const ts = data.createdAt?.toDate?.()?.getTime() || 0;
        const exTs = existing?.createdAt?.toDate?.()?.getTime() || 0;
        if (!existing || ts > exTs) {
          map.set(key, { id:d.id, ...data });
        }
      });
      const list = Array.from(map.values()).sort((a,b)=>{
        const ta = a.createdAt?.toDate?.()?.getTime()||0;
        const tb = b.createdAt?.toDate?.()?.getTime()||0;
        return tb-ta;
      });
      setThreads(list);
      setLoading(false);
    }, err => { if (err.code !== "permission-denied") console.error(err); setLoading(false); });
    return () => unsub();
  }, [uid]);

  const unreadCount = threads.filter(t=>t.status==="pending").length;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Client Messages</p>
          <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <span onClick={()=>router.push("/freelancer/messages")} style={{ fontSize:12, color:C.accent, fontWeight:600, cursor:"pointer" }}>Open Chat →</span>
      </div>

      {/* List */}
      <div style={{ padding:"12px 16px" }}>
        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} style={{ height:52, background:C.surface, borderRadius:8, marginBottom:8, opacity:0.5 }}/>
          ))
        ) : threads.length === 0 ? (
          <div style={{ padding:"24px 0", textAlign:"center", color:C.muted, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
            No client messages yet
          </div>
        ) : (
          threads.slice(0,4).map((t,i) => (
            <div key={t.id} className="row" style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"11px 8px", borderBottom: i < Math.min(threads.length,4)-1 ? `1px solid ${C.border}` : "none", cursor:"pointer", borderRadius:8, transition:"background 0.15s" }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:GRADS[i%GRADS.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {(t.clientName||"C").charAt(0)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <p style={{ fontSize:13, fontWeight:600 }}>{t.clientName||"Client"}</p>
                  <p style={{ fontSize:11, color:C.muted }}>{timeAgo(t.createdAt)}</p>
                </div>
                <p style={{ fontSize:12, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {t.projectDescription}
                </p>
              </div>
              {t.status==="pending" && (
                <span style={{ width:8, height:8, background:C.purple, borderRadius:"50%", flexShrink:0, marginTop:6 }}/>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
