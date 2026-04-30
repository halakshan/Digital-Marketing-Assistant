"use client";

import { useState, useEffect, useCallback } from "react";
import { getIdToken } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

interface HireRequest {
  id:                 string;
  clientUid:          string;
  clientName:         string;
  freelancerUid:      string;
  projectDescription: string;
  budget:             string;
  status:             "pending"|"accepted"|"declined"|"completed";
  createdAt:          any;
}

const statusColor: Record<string,string> = {
  pending:   "#eab308",
  accepted:  "#22c55e",
  declined:  "#ef4444",
  completed: "#3b82f6",
};
const statusIcon: Record<string,string> = { pending:"🕐", accepted:"✅", declined:"❌", completed:"🏆" };

export default function JobMatches() {
  const { uid, firebaseUser } = useFreelancerUser();
  const [requests,  setRequests]  = useState<HireRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [responding,setResponding]= useState<string|null>(null);
  const [toast,     setToast]     = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // Real-time Firestore listener
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "hire_requests"),
      where("freelancerUid", "==", uid)
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as HireRequest))
        .sort((a,b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() || new Date(a.createdAt||0).getTime();
          const tb = b.createdAt?.toDate?.()?.getTime() || new Date(b.createdAt||0).getTime();
          return tb - ta;
        });
      setRequests(docs);
      setLoading(false);
    }, err => { if (err.code !== "permission-denied") console.error(err); setLoading(false); });
    return () => unsub();
  }, [uid]);

  const respond = async (id: string, status: "accepted"|"declined") => {
    if (!firebaseUser) return;
    setResponding(id);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/freelancer/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) showToast(status === "accepted" ? "✅ Request accepted!" : "Request declined");
      else showToast(data.message||"Failed", false);
    } catch { showToast("Failed to respond", false); }
    finally { setResponding(null); }
  };

  const pending   = requests.filter(r => r.status === "pending");
  const others    = requests.filter(r => r.status !== "pending");
  const displayed = [...pending, ...others].slice(0, 8);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", position:"relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"absolute", top:12, right:12, zIndex:10, background: toast.ok?"#22c55e":"#ef4444", color:"#fff", fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:8 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Hire Requests</p>
          <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            {pending.length > 0 ? `${pending.length} pending` : "No pending requests"}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {pending.length > 0 && (
            <span style={{ fontSize:11, background:"rgba(234,179,8,0.15)", border:"1px solid rgba(234,179,8,0.35)", color:C.yellow, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>
              {pending.length} New
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8, maxHeight:340, overflowY:"auto" }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ height:60, background:C.surface, borderRadius:10, opacity:0.5 }}/>
          ))
        ) : displayed.length === 0 ? (
          <div style={{ padding:"24px 0", textAlign:"center", color:C.muted, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            No hire requests yet
          </div>
        ) : (
          displayed.map(req => (
            <div key={req.id} style={{
              background: req.status==="pending" ? "rgba(124,58,237,0.06)" : C.surface,
              border: `1px solid ${req.status==="pending" ? "rgba(124,58,237,0.25)" : C.border}`,
              borderRadius:10, padding:"10px 12px",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{
                  width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,#7c3aed,#3b82f6)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, fontWeight:700, color:"#fff", flexShrink:0,
                }}>
                  {req.clientName?.charAt(0)||"C"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{req.clientName}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:600,
                      background:`${statusColor[req.status]}18`, border:`1px solid ${statusColor[req.status]}50`, color:statusColor[req.status] }}>
                      {statusIcon[req.status]} {req.status.charAt(0).toUpperCase()+req.status.slice(1)}
                    </span>
                  </div>
                  <p style={{ fontSize:11, color:C.muted, lineHeight:1.5,
                    overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
                    {req.projectDescription}
                  </p>
                  {req.budget && (
                    <p style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:3 }}>💰 {req.budget}</p>
                  )}
                </div>
              </div>

              {/* Accept / Decline buttons for pending */}
              {req.status === "pending" && (
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button
                    onClick={() => respond(req.id, "declined")}
                    disabled={responding===req.id}
                    style={{ flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${C.border}`,
                      background:"transparent", color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer",
                      opacity: responding===req.id ? 0.5 : 1 }}>
                    ✕ Decline
                  </button>
                  <button
                    onClick={() => respond(req.id, "accepted")}
                    disabled={responding===req.id}
                    style={{ flex:2, padding:"7px 0", borderRadius:8, border:"none",
                      background:"linear-gradient(135deg,#7c3aed,#3b82f6)", color:"#fff",
                      fontSize:12, fontWeight:700, cursor:"pointer",
                      opacity: responding===req.id ? 0.5 : 1 }}>
                    {responding===req.id ? "…" : "✓ Accept"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
