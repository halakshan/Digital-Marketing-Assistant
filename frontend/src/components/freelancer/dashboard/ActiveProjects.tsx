"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

interface Project {
  id:                 string;
  clientName:         string;
  projectDescription: string;
  budget:             string;
  status:             string;
  createdAt:          any;
}

const statusMap: Record<string, { bg:string; color:string; border:string; label:string }> = {
  accepted:  { bg:"rgba(59,130,246,0.12)",  color:"#3b82f6", border:"rgba(59,130,246,0.3)",  label:"In Progress" },
  completed: { bg:"rgba(124,58,237,0.12)", color:"#a78bfa", border:"rgba(124,58,237,0.3)", label:"Done"        },
};

const ICONS = ["🎨","🎬","💻","📱","🏷️","📸","✍️","📣"];

export default function ActiveProjects() {
  const router = useRouter();
  const { uid } = useFreelancerUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "hire_requests"),
      where("freelancerUid", "==", uid),
      where("status", "in", ["accepted","completed"])
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs
        .map(d => ({ id:d.id, ...d.data() } as Project))
        .sort((a,b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() || 0;
          const tb = b.createdAt?.toDate?.()?.getTime() || 0;
          return tb - ta;
        });
      setProjects(docs);
      setLoading(false);
    }, err => { if (err.code !== "permission-denied") console.error(err); setLoading(false); });
    return () => unsub();
  }, [uid]);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Active Projects</p>
          <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            {loading ? "Loading…" : `${projects.filter(p=>p.status==="accepted").length} in progress`}
          </p>
        </div>
        <span onClick={()=>router.push("/freelancer/projects")} style={{ fontSize:12, color:C.accent, fontWeight:600, cursor:"pointer" }}>View All →</span>
      </div>

      {/* List */}
      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:4, maxHeight:280, overflowY:"auto" }}>
        {loading ? (
          [1,2].map(i=><div key={i} style={{ height:56, background:C.surface, borderRadius:10, marginBottom:4, opacity:0.5 }}/>)
        ) : projects.length === 0 ? (
          <div style={{ padding:"24px 0", textAlign:"center", color:C.muted, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            No active projects yet<br/>
            <span style={{ fontSize:11 }}>Accept hire requests to see them here</span>
          </div>
        ) : (
          projects.slice(0,5).map((p,i) => {
            const st = statusMap[p.status] || statusMap.accepted;
            return (
              <div key={p.id} className="row" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 8px", borderRadius:10, cursor:"pointer", transition:"background 0.15s" }}>
                <div style={{ width:40, height:40, background:C.surface, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                  {ICONS[i % ICONS.length]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.projectDescription.slice(0,50)}{p.projectDescription.length>50?"…":""}
                  </p>
                  <p style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                    {p.clientName} • {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""}
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                  {p.budget && <p style={{ fontSize:13, fontWeight:700, color:C.green, fontFamily:"'JetBrains Mono',monospace" }}>{p.budget}</p>}
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
