"use client";

import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "./dashboardData";

const CATEGORY_ICONS: Record<string, string> = {
  designer:"🎨", video:"🎬", developer:"💻", photographer:"📸",
  influencer:"⭐", writer:"✍️", marketer:"📣", other:"🧑‍💼",
};

export default function ProfileBanner() {
  const router = useRouter();
  const { userName, userInitial, userPhoto, category, bio, skills,
          rating, reviewCount, completedOrders, available, profileExists } = useFreelancerUser();

  const catIcon = CATEGORY_ICONS[category] || "🧑‍💼";

  return (
    <div style={{ position:"relative", background:"linear-gradient(135deg,#1a1040,#0f172a,#130d2e)", border:`1px solid ${C.border}`, borderRadius:14, padding:24, display:"flex", alignItems:"center", gap:20, overflow:"hidden" }}>

      {/* Glow */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.12),transparent 60%)", pointerEvents:"none" }}/>

      {/* Avatar */}
      <div style={{ position:"relative", flexShrink:0 }}>
        {userPhoto ? (
          <img src={userPhoto} alt={userName} style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", border:`3px solid ${C.purple}`, boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}/>
        ) : (
          <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:700, color:"#fff", border:`3px solid ${C.purple}`, boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}>
            {userInitial}
          </div>
        )}
        <span className="blink" style={{ position:"absolute", bottom:2, right:2, width:14, height:14, background: available ? C.green : C.muted, borderRadius:"50%", border:`2px solid ${C.bg}` }}/>
      </div>

      {/* Info */}
      <div style={{ flex:1, position:"relative" }}>
        <p style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{userName || "Freelancer"}</p>
        <p style={{ fontSize:13, color:C.accent, marginBottom:bio?6:8 }}>
          {catIcon} {category ? category.charAt(0).toUpperCase()+category.slice(1) : "Freelancer"}
        </p>
        {bio && <p style={{ fontSize:12, color:C.subtle, lineHeight:1.6, marginBottom:8, maxWidth:420 }}>{bio.slice(0,120)}{bio.length>120?"…":""}</p>}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {(skills.length > 0 ? skills.slice(0,6) : []).map(s => (
            <span key={s} style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background:C.purpleGlow, border:"1px solid rgba(124,58,237,0.3)", color:C.accent, fontWeight:500 }}>
              {s}
            </span>
          ))}
          {!profileExists && (
            <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background:"rgba(234,179,8,0.1)", border:"1px solid rgba(234,179,8,0.3)", color:C.yellow, fontWeight:500 }}>
              ⚠️ Complete your profile
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:28, position:"relative" }}>
        {[
          { val: rating > 0 ? rating.toFixed(1) : "—", label:"⭐ Rating"  },
          { val: completedOrders || 0,                  label:"Jobs Done"  },
          { val: reviewCount > 0 ? reviewCount : "—",  label:"Reviews"    },
        ].map(s => (
          <div key={s.label} style={{ textAlign:"center" }}>
            <p style={{ fontSize:18, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
            <p style={{ fontSize:11, color:C.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, background: available ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)", border:`1px solid ${available ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)"}`, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600, color: available ? C.green : C.muted }}>
          <span className="blink" style={{ width:8, height:8, background: available ? C.green : C.muted, borderRadius:"50%" }}/>
          {available ? "Available for Work" : "Not Available"}
        </div>
        <button
          onClick={() => router.push("/freelancer/profile")}
          style={{ fontSize:12, fontWeight:600, border:`1px solid rgba(124,58,237,0.5)`, color:C.accent, padding:"7px 14px", borderRadius:9, background:"transparent", cursor:"pointer", fontFamily:"'Sora',sans-serif" }}>
          ✏️ Edit Profile
        </button>
      </div>
    </div>
  );
}
