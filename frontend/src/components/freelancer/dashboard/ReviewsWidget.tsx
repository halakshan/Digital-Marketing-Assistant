"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

interface Review {
  id:         string;
  clientName: string;
  stars:      number;
  text:       string;
  createdAt:  any;
}

export default function ReviewsWidget() {
  const { uid, rating, reviewCount } = useFreelancerUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db,"reviews"), where("freelancerUid","==",uid))
        );
        const list = snap.docs
          .map(d=>({ id:d.id, ...d.data() } as Review))
          .sort((a,b)=>{
            const ta = a.createdAt?.toDate?.()?.getTime()||0;
            const tb = b.createdAt?.toDate?.()?.getTime()||0;
            return tb-ta;
          });
        setReviews(list);
      } catch { /**/ }
      finally { setLoading(false); }
    };
    load();
  }, [uid]);

  const avgRating = rating > 0 ? rating.toFixed(1) : (reviews.length > 0 ? (reviews.reduce((s,r)=>s+r.stars,0)/reviews.length).toFixed(1) : "—");

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", flex:1 }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Recent Reviews</p>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          {avgRating !== "—" && <span style={{ color:C.yellow, fontSize:13 }}>★</span>}
          <span style={{ fontSize:12, color:C.muted }}>{avgRating}</span>
          {reviewCount > 0 && <span style={{ fontSize:11, color:C.muted }}>({reviewCount})</span>}
        </div>
      </div>

      {/* List */}
      <div style={{ padding:"12px 20px" }}>
        {loading ? (
          [1,2].map(i=><div key={i} style={{ height:60, background:C.surface, borderRadius:8, marginBottom:8, opacity:0.5 }}/>)
        ) : reviews.length === 0 ? (
          <div style={{ padding:"20px 0", textAlign:"center", color:C.muted, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⭐</div>
            No reviews yet<br/>
            <span style={{ fontSize:11 }}>Complete projects to earn reviews</span>
          </div>
        ) : (
          reviews.slice(0,3).map((r,i) => (
            <div key={r.id} style={{ padding:"12px 0", borderBottom: i < Math.min(reviews.length,3)-1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <p style={{ fontSize:13, fontWeight:600 }}>{r.clientName}</p>
                <span style={{ color:C.yellow, fontSize:11 }}>{"★".repeat(r.stars)}</span>
              </div>
              <p style={{ fontSize:12, color:C.subtle, lineHeight:1.6 }}>{r.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
