"use client";

import { useState, useEffect, useRef } from "react";
import { getIdToken } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";
import { C } from "@/components/freelancer/dashboard/dashboardData";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const CATEGORIES = ["designer","video","developer","photographer","influencer","writer","marketer","other"];
const CAT_ICONS: Record<string,string> = { designer:"🎨",video:"🎬",developer:"💻",photographer:"📸",influencer:"⭐",writer:"✍️",marketer:"📣",other:"🧑‍💼" };

const ALL_SKILLS = [
  "Logo Design","Branding","Social Media","Canva","Adobe XD","Figma",
  "Premiere Pro","After Effects","DaVinci Resolve","Motion Graphics",
  "React","Next.js","TypeScript","Tailwind","Node.js","PHP","WordPress",
  "Product Photography","Portrait","Events","Lightroom",
  "Instagram","TikTok","YouTube","Facebook Ads","SEO Writing",
  "Sinhala Content","Tamil Content","English Content","Email Marketing",
  "Shopify","WooCommerce","UI/UX","Video Editing","Color Grading",
];

interface Review {
  id:string; clientName:string; stars:number; text:string; createdAt:any;
}

export default function ProfilePage() {
  const { uid, firebaseUser, userName, userInitial, userPhoto, userEmail,
          category, bio, skills, rate, location, rating, reviewCount,
          completedOrders, available, profileExists, authLoading } = useFreelancerUser();

  const [tab,        setTab]        = useState<"profile"|"reviews"|"portfolio">("profile");
  const [editing,    setEditing]    = useState(!profileExists);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{msg:string;ok:boolean}|null>(null);

  // Form fields (local edit state)
  const [fName,      setFName]      = useState("");
  const [fCategory,  setFCategory]  = useState("designer");
  const [fBio,       setFBio]       = useState("");
  const [fSkills,    setFSkills]    = useState<string[]>([]);
  const [fRate,      setFRate]      = useState("");
  const [fLocation,  setFLocation]  = useState("");
  const [fAvail,     setFAvail]     = useState(true);
  const [skillSearch,setSkillSearch]= useState("");

  // Photo upload/delete
  const [localPhoto,   setLocalPhoto]   = useState("");
  const [photoSaving,  setPhotoSaving]  = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Keep localPhoto in sync with context photo
  useEffect(() => { setLocalPhoto(userPhoto || ""); }, [userPhoto]);

  // ── Photo: Canvas resize → base64 → Firestore (same as client side) ──
  const handlePhotoUpload = (file: File) => {
    if (!uid) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        setPhotoSaving(true);
        try {
          const size = 200;
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext("2d")!;
          const min = Math.min(img.width, img.height);
          const sx = (img.width  - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          await Promise.all([
            updateDoc(doc(db, "freelancer_profiles", uid), { profilePhoto: dataUrl, updatedAt: serverTimestamp() }),
            updateDoc(doc(db, "users", uid),               { profilePhoto: dataUrl, updatedAt: serverTimestamp() }),
          ]);
          setLocalPhoto(dataUrl);
          showToast("✅ Profile photo updated!");
        } catch { showToast("Failed to save photo", false); }
        finally { setPhotoSaving(false); }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Remove photo ──
  const handleDeletePhoto = async () => {
    if (!uid || !localPhoto) return;
    if (!confirm("Remove your profile photo?")) return;
    try {
      await Promise.all([
        updateDoc(doc(db, "freelancer_profiles", uid), { profilePhoto: "", updatedAt: serverTimestamp() }),
        updateDoc(doc(db, "users", uid),               { profilePhoto: "", updatedAt: serverTimestamp() }),
      ]);
      setLocalPhoto("");
      showToast("✅ Profile photo removed.");
    } catch { showToast("Failed to remove photo", false); }
  };

  // Reviews
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [revLoading, setRevLoading] = useState(true);

  const showToast = (msg:string,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  // Sync form from context when context loads
  useEffect(() => {
    setFName(userName||"");
    setFCategory(category||"designer");
    setFBio(bio||"");
    setFSkills(skills||[]);
    setFRate(rate||"");
    setFLocation(location||"");
    setFAvail(available);
    if (!profileExists && !authLoading) setEditing(true);
  }, [userName, category, bio, skills, rate, location, available, profileExists, authLoading]);

  // Load reviews
  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db,"reviews"), where("freelancerUid","==",uid)))
      .then(snap => {
        setReviews(snap.docs.map(d=>({id:d.id,...d.data()} as Review)).sort((a,b)=>{
          const ta=a.createdAt?.toDate?.()?.getTime()||0;
          const tb=b.createdAt?.toDate?.()?.getTime()||0;
          return tb-ta;
        }));
      })
      .catch(() => { /* permission-denied or network — show empty */ })
      .finally(() => setRevLoading(false));
  }, [uid]);

  const toggleSkill = (s:string) => {
    setFSkills(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!firebaseUser || !fName.trim()) return;
    setSaving(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch(`${API}/freelancer/profile`, {
        method:"PUT",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({
          fullName:  fName.trim(),
          category:  fCategory,
          bio:       fBio.trim(),
          skills:    fSkills,
          rate:      fRate.trim(),
          location:  fLocation.trim(),
          available: fAvail,
        }),
      });
      const data = await res.json();
      if (data.success) { showToast("✅ Profile saved! Changes sync across the app instantly."); setEditing(false); }
      else showToast(data.message||"Save failed",false);
    } catch { showToast("Failed to save",false); }
    finally { setSaving(false); }
  };

  if (authLoading) {
    return <div style={{padding:40,textAlign:"center",color:C.muted}}>Loading your profile…</div>;
  }

  const avgRating = rating > 0 ? rating.toFixed(1) : reviews.length > 0 ? (reviews.reduce((s,r)=>s+r.stars,0)/reviews.length).toFixed(1) : null;
  const filteredSkills = ALL_SKILLS.filter(s=>s.toLowerCase().includes(skillSearch.toLowerCase()));

  return (
    <div style={{ padding:28, fontFamily:"'Sora',sans-serif", color:C.text, position:"relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap'); *{box-sizing:border-box;}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:100, background:toast.ok?"#22c55e":"#ef4444", color:"#fff", padding:"12px 20px", borderRadius:12, fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ position:"relative", background:"linear-gradient(135deg,#1a1040,#0f172a,#130d2e)", border:`1px solid ${C.border}`, borderRadius:16, padding:28, marginBottom:24, overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%,rgba(124,58,237,0.12),transparent 60%)", pointerEvents:"none" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:24, position:"relative", flexWrap:"wrap" }}>

          {/* Avatar with upload/delete */}
          <div style={{ position:"relative", flexShrink:0 }}>
            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display:"none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
            />

            {/* Photo or initials */}
            {localPhoto ? (
              <img src={localPhoto} alt={userName} style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover", border:`3px solid ${C.purple}`, boxShadow:"0 0 28px rgba(124,58,237,0.45)" }}/>
            ) : (
              <div style={{ width:90, height:90, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, fontWeight:700, color:"#fff", border:`3px solid ${C.purple}`, boxShadow:"0 0 28px rgba(124,58,237,0.45)" }}>
                {userInitial}
              </div>
            )}

            {/* Saving overlay */}
            {photoSaving && (
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                ⏳
              </div>
            )}

            {/* 📷 camera button */}
            {!photoSaving && (
              <button onClick={() => photoInputRef.current?.click()} title="Change photo"
                style={{ position:"absolute", bottom:-2, right: localPhoto ? 22 : -2, width:26, height:26, borderRadius:"50%", background:C.purple, border:"2px solid #0d0f1a", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12 }}>
                📷
              </button>
            )}

            {/* 🗑 delete button — only when photo exists */}
            {localPhoto && !photoSaving && (
              <button onClick={handleDeletePhoto} title="Remove photo"
                style={{ position:"absolute", bottom:-2, right:-2, width:26, height:26, borderRadius:"50%", background:"#ef4444", border:"2px solid #0d0f1a", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:11 }}>
                🗑
              </button>
            )}

            {/* Online/available dot */}
            <span style={{ position:"absolute", top:3, right:3, width:14, height:14, background: fAvail?C.green:C.muted, borderRadius:"50%", border:`2px solid #0d0f1a` }}/>
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:220 }}>
            <p style={{ fontSize:24, fontWeight:700, color:"#fff", marginBottom:4 }}>{userName}</p>
            <p style={{ fontSize:14, color:C.accent, marginBottom:8 }}>
              {CAT_ICONS[category]||"🧑‍💼"} {category ? category.charAt(0).toUpperCase()+category.slice(1) : "Freelancer"}
              {location && ` • 📍 ${location}`}
            </p>
            {userEmail && <p style={{ fontSize:12, color:C.muted }}>{userEmail}</p>}
            {!profileExists && (
              <p style={{ fontSize:12, color:C.yellow, marginTop:6 }}>⚠️ Complete your profile to appear in the marketplace</p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:28 }}>
            {[
              { val: avgRating||"—",       label:"⭐ Rating"  },
              { val: completedOrders||0,   label:"Jobs Done"  },
              { val: reviews.length||0,    label:"Reviews"    },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <p style={{ fontSize:20, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>{s.val}</p>
                <p style={{ fontSize:11, color:C.muted }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Edit toggle */}
          <button onClick={()=>setEditing(e=>!e)}
            style={{ background: editing?C.border:C.purple, color:"#fff", border:"none", padding:"10px 20px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
            {editing ? "✕ Cancel" : "✏️ Edit Profile"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:4, background:C.surface, borderRadius:12, padding:4, marginBottom:24, width:"fit-content" }}>
        {(["profile","reviews","portfolio"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:"8px 20px", borderRadius:9, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Sora',sans-serif",
              background: tab===t ? C.purple : "transparent",
              color: tab===t ? "#fff" : C.muted,
            }}>
            {t==="profile"?"👤 Profile":t==="reviews"?"⭐ Reviews":"🎨 Portfolio"}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab==="profile" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* Left: edit form or read view */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
            <p style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>{editing ? "✏️ Edit Your Profile" : "📋 Your Profile"}</p>

            {editing ? (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Name */}
                <Field label="Full Name *" value={fName} onChange={setFName} placeholder="Your full name"/>

                {/* Category */}
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:600, display:"block", marginBottom:6 }}>Category *</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {CATEGORIES.map(c=>(
                      <button key={c} onClick={()=>setFCategory(c)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${fCategory===c?C.purple:C.border}`, background: fCategory===c?C.purpleGlow:"transparent", color: fCategory===c?C.accent:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        {CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:600, display:"block", marginBottom:6 }}>Bio</label>
                  <textarea value={fBio} onChange={e=>setFBio(e.target.value)} rows={4}
                    placeholder="Describe your expertise, experience, and what makes you stand out…"
                    style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:13, resize:"vertical", outline:"none", fontFamily:"'Sora',sans-serif" }}/>
                  <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>{fBio.length}/300</p>
                </div>

                {/* Rate */}
                <Field label="Hourly Rate" value={fRate} onChange={setFRate} placeholder="e.g. LKR 2,500/hr"/>

                {/* Location */}
                <Field label="Location" value={fLocation} onChange={setFLocation} placeholder="e.g. Colombo, Sri Lanka"/>

                {/* Availability */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:600 }}>Available for Work</label>
                  <button onClick={()=>setFAvail(a=>!a)} style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", background: fAvail?C.green:C.border, position:"relative", transition:"background 0.2s" }}>
                    <span style={{ position:"absolute", top:2, left: fAvail?22:2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
                  </button>
                  <span style={{ fontSize:12, color: fAvail?C.green:C.muted }}>{fAvail?"Yes":"No"}</span>
                </div>

                <button onClick={handleSave} disabled={saving||!fName.trim()}
                  style={{ background:"linear-gradient(135deg,#7c3aed,#3b82f6)", color:"#fff", border:"none", padding:"13px 0", borderRadius:12, fontSize:14, fontWeight:700, cursor: saving||!fName.trim()?"not-allowed":"pointer", opacity: saving||!fName.trim()?0.6:1, fontFamily:"'Sora',sans-serif" }}>
                  {saving ? "Saving…" : "💾 Save Profile"}
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <InfoRow label="Category" value={`${CAT_ICONS[category]||""} ${category||"—"}`}/>
                <InfoRow label="Rate"     value={rate||"—"}/>
                <InfoRow label="Location" value={location||"—"}/>
                <InfoRow label="Status"   value={available?"✅ Available for Work":"❌ Not Available"}/>
                {bio && (
                  <div>
                    <p style={{ fontSize:12, color:C.muted, fontWeight:600, marginBottom:6 }}>Bio</p>
                    <p style={{ fontSize:13, color:C.subtle, lineHeight:1.7 }}>{bio}</p>
                  </div>
                )}
                <button onClick={()=>setEditing(true)}
                  style={{ marginTop:8, background:C.purpleGlow, border:`1px solid rgba(124,58,237,0.4)`, color:C.accent, padding:"10px 0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  ✏️ Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Right: skills */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
            <p style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🛠️ Skills {editing && <span style={{ fontSize:12, color:C.muted, fontWeight:400 }}>({fSkills.length} selected)</span>}</p>

            {editing ? (
              <>
                <input value={skillSearch} onChange={e=>setSkillSearch(e.target.value)} placeholder="Search skills…"
                  style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:9, padding:"8px 12px", color:C.text, fontSize:13, outline:"none", marginBottom:12, fontFamily:"'Sora',sans-serif" }}/>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, maxHeight:220, overflowY:"auto" }}>
                  {filteredSkills.map(s => {
                    const sel = fSkills.includes(s);
                    return (
                      <button key={s} onClick={()=>toggleSkill(s)} style={{ padding:"6px 12px", borderRadius:20, border:`1px solid ${sel?C.purple:C.border}`, background: sel?C.purpleGlow:"transparent", color: sel?C.accent:C.subtle, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                        {sel?"✓ ":""}{s}
                      </button>
                    );
                  })}
                </div>
                {fSkills.length > 0 && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Selected:</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {fSkills.map(s => (
                        <span key={s} onClick={()=>toggleSkill(s)} style={{ padding:"4px 10px", borderRadius:20, background:C.purpleGlow, border:`1px solid rgba(124,58,237,0.4)`, color:C.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                          {s} ✕
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {skills.length > 0 ? skills.map(s=>(
                  <span key={s} style={{ padding:"6px 14px", borderRadius:20, background:C.purpleGlow, border:`1px solid rgba(124,58,237,0.3)`, color:C.accent, fontSize:12, fontWeight:500 }}>{s}</span>
                )) : (
                  <p style={{ fontSize:13, color:C.muted }}>No skills added yet. Edit profile to add skills.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {tab==="reviews" && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <p style={{ fontSize:15, fontWeight:700 }}>⭐ Client Reviews</p>
            {avgRating && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:C.yellow, fontSize:18 }}>★</span>
                <span style={{ fontSize:20, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>{avgRating}</span>
                <span style={{ fontSize:13, color:C.muted }}>({reviews.length} review{reviews.length!==1?"s":""})</span>
              </div>
            )}
          </div>
          {revLoading ? (
            <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>Loading…</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
              <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>
              <p>No reviews yet. Complete projects to earn your first review!</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <p style={{ fontWeight:600 }}>{r.clientName}</p>
                    <span style={{ color:C.yellow }}>{"★".repeat(r.stars)}{"☆".repeat(5-r.stars)}</span>
                  </div>
                  <p style={{ fontSize:13, color:C.subtle, lineHeight:1.7 }}>{r.text}</p>
                  {r.createdAt && (
                    <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>
                      {r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}) : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Portfolio Tab ── */}
      {tab==="portfolio" && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <p style={{ fontSize:15, fontWeight:700 }}>🎨 Portfolio</p>
            <span style={{ fontSize:12, color:C.muted }}>Showcase your best work</span>
          </div>
          <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🖼️</div>
            <p style={{ marginBottom:8 }}>Portfolio management coming soon</p>
            <p style={{ fontSize:12 }}>Your completed projects from hire requests will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function Field({ label, value, onChange, placeholder }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string }) {
  const { C: _C } = { C };
  return (
    <div>
      <label style={{ fontSize:12, color:C.muted, fontWeight:600, display:"block", marginBottom:6 }}>{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:13, outline:"none", fontFamily:"'Sora',sans-serif" }}/>
    </div>
  );
}

function InfoRow({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
      <span style={{ fontSize:12, color:C.muted, fontWeight:600, width:80, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:C.text }}>{value}</span>
    </div>
  );
}
