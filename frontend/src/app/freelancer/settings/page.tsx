"use client";

import { useState, useEffect, useRef } from "react";
import { useFreelancerUser }   from "@/context/FreelancerUserContext";
import { C }                   from "@/components/freelancer/dashboard/dashboardData";
import { TABS, TAB_ICONS }     from "@/components/freelancer/settings/settingsData";
import SettingsSidebar         from "@/components/freelancer/settings/SettingsSidebar";
import NotificationsTab        from "@/components/freelancer/settings/tabs/NotificationsTab";
import PrivacyTab              from "@/components/freelancer/settings/tabs/PrivacyTab";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const INPUT_STYLE = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e2e8f0",
  fontFamily: "'Sora',sans-serif", outline: "none", marginBottom: 16,
};
const LABEL_STYLE = {
  fontSize: 11, fontWeight: 600 as const, color: "#64748b",
  textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "block", marginBottom: 6,
};

export default function SettingsPage() {
  const { firebaseUser, userName, userPhoto, uid, token, authLoading } = useFreelancerUser();

  const [tab,     setTab]     = useState("Profile");
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state — loaded from real API
  const [form, setForm] = useState({
    fullName:  "",
    email:     "",
    phone:     "",
    bio:       "",
    location:  "",
    category:  "",
    rate:      "",
    skills:    [] as string[],
    available: true,
  });
  const [skillInput, setSkillInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  // Notif / Privacy local state (not yet wired to backend — keep as-is)
  const [notifs, setNotifs]   = useState({ messages:true, payments:true, reviews:true, marketing:false });
  const [privacy, setPrivacy] = useState({ profilePublic:true, showEarnings:false, showLocation:true });

  // ── Load real profile on mount ──
  useEffect(() => {
    if (!token || !firebaseUser) return;
    fetch(`${API}/freelancer/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const p = data.profile;
        if (p) {
          setForm({
            fullName:  p.fullName  || userName || "",
            email:     firebaseUser.email || "",
            phone:     p.phone    || "",
            bio:       p.bio      || "",
            location:  p.location || "",
            category:  p.category || "",
            rate:      p.rate     || "",
            skills:    p.skills   || [],
            available: p.available !== false,
          });
          setPhotoPreview(p.profilePhoto || userPhoto || "");
        } else {
          // No profile yet — pre-fill from auth
          setForm(f => ({
            ...f,
            fullName: userName || firebaseUser.displayName || "",
            email:    firebaseUser.email || "",
          }));
          setPhotoPreview(userPhoto || firebaseUser.photoURL || "");
        }
      })
      .catch(() => {});
  }, [token, firebaseUser, userName, userPhoto]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Photo: resize via Canvas → base64 → save directly to Firestore (same as client side) ──
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
          // Save to both Firestore docs so sidebar/topbar updates instantly
          await Promise.all([
            updateDoc(doc(db, "freelancer_profiles", uid), { profilePhoto: dataUrl, updatedAt: serverTimestamp() }),
            updateDoc(doc(db, "users", uid),               { profilePhoto: dataUrl, updatedAt: serverTimestamp() }),
          ]);
          setPhotoPreview(dataUrl);
          showToast("✅ Profile photo updated!");
        } catch { showToast("Failed to save photo", false); }
        finally { setPhotoSaving(false); }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Remove photo — clear from Firestore ──
  const handleDeletePhoto = async () => {
    if (!uid || !photoPreview) return;
    if (!confirm("Remove your profile photo?")) return;
    try {
      await Promise.all([
        updateDoc(doc(db, "freelancer_profiles", uid), { profilePhoto: "", updatedAt: serverTimestamp() }),
        updateDoc(doc(db, "users", uid),               { profilePhoto: "", updatedAt: serverTimestamp() }),
      ]);
      setPhotoPreview("");
      showToast("✅ Profile photo removed.");
    } catch { showToast("Failed to remove photo", false); }
  };

  // ── Save Profile ──
  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/freelancer/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          fullName:     form.fullName,
          category:     form.category,
          bio:          form.bio,
          skills:       form.skills,
          rate:         form.rate,
          location:     form.location,
          profilePhoto: photoPreview,
          available:    form.available,
        }),
      });
      const data = await res.json();
      if (data.success) showToast("✅ Profile saved successfully!");
      else              showToast(data.message || "Failed to save", false);
    } catch { showToast("Network error", false); }
    finally { setSaving(false); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
  };
  const removeSkill = (s: string) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  if (authLoading) return null;

  const initial = (form.fullName || userName || "F").charAt(0).toUpperCase();

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        input::placeholder, textarea::placeholder { color:#64748b; }
        input:focus, textarea:focus, select:focus { border-color:rgba(124,58,237,0.5) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:999, background: toast.ok ? "#22c55e" : "#ef4444", color:"#fff", padding:"12px 20px", borderRadius:12, fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Manage your account preferences</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>

        {/* Sidebar */}
        <SettingsSidebar active={tab} onChange={setTab} />

        {/* Content */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>

          {/* ── PROFILE TAB ── */}
          {tab === "Profile" && (
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profile Information</p>

              {/* Avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:16, background:"rgba(255,255,255,0.03)", borderRadius:12, border:`1px solid ${C.border}` }}>

                {/* Photo / Initials with hover overlay */}
                <div style={{ position:"relative", flexShrink:0, cursor:"pointer" }} onClick={() => fileInputRef.current?.click()}>
                  {photoPreview
                    ? <img src={photoPreview} alt="Profile" style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", border:`3px solid ${C.purple}` }} />
                    : <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:700, color:"#fff", border:`3px solid ${C.purple}` }}>
                        {initial}
                      </div>
                  }
                  {/* Camera overlay */}
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, opacity: photoSaving ? 1 : 0, transition:"opacity 0.2s" }}
                    onMouseEnter={e => !photoSaving && (e.currentTarget.style.opacity="1")}
                    onMouseLeave={e => !photoSaving && (e.currentTarget.style.opacity="0")}
                  >
                    {photoSaving ? "⏳" : "📷"}
                  </div>
                </div>

                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />

                {/* Info */}
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{form.fullName || "Your Name"}</p>
                  <p style={{ fontSize:12, color:C.muted }}>Click photo to change · JPG or PNG</p>
                </div>

                {/* Buttons */}
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <label style={{ background:"transparent", color:C.accent, border:`1px solid rgba(124,58,237,0.4)`, padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    📷 Change Photo
                    <input type="file" accept="image/*" style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }} />
                  </label>
                  {photoPreview && (
                    <button onClick={handleDeletePhoto}
                      style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", padding:"8px 14px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      🗑️ Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <label style={LABEL_STYLE}>Full Name</label>
              <input style={INPUT_STYLE} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Your full name" />

              <label style={LABEL_STYLE}>Email</label>
              <input style={{ ...INPUT_STYLE, opacity: 0.6, cursor:"not-allowed" }} value={form.email} readOnly title="Email cannot be changed here" />

              <label style={LABEL_STYLE}>Category / Specialty</label>
              <input style={INPUT_STYLE} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Graphic Designer, Video Editor" />

              <label style={LABEL_STYLE}>Hourly / Project Rate</label>
              <input style={INPUT_STYLE} value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="e.g. LKR 5,000/hr or LKR 30,000/project" />

              <label style={LABEL_STYLE}>Location</label>
              <input style={INPUT_STYLE} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Colombo, Sri Lanka" />

              <label style={LABEL_STYLE}>Bio</label>
              <textarea style={{ ...INPUT_STYLE, minHeight:100, resize:"vertical" }} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Describe your skills and experience…" />

              {/* Skills */}
              <label style={LABEL_STYLE}>Skills</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                {form.skills.map(s => (
                  <span key={s} style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:"#a78bfa", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                    {s}
                    <button onClick={() => removeSkill(s)} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer", fontSize:13, padding:0, lineHeight:1 }}>✕</button>
                  </span>
                ))}
                {form.skills.length === 0 && <p style={{ fontSize:12, color:C.muted }}>No skills added yet</p>}
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                <input
                  style={{ ...INPUT_STYLE, marginBottom:0, flex:1 }}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); addSkill(); }}}
                  placeholder="Add a skill (e.g. Photoshop) and press Enter"
                />
                <button onClick={addSkill} style={{ background:C.purple, border:"none", color:"#fff", borderRadius:10, padding:"0 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Add
                </button>
              </div>

              {/* Availability toggle */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>Available for Work</p>
                  <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>Show clients you're open to new projects</p>
                </div>
                <div
                  onClick={() => setForm(f => ({ ...f, available: !f.available }))}
                  style={{ width:44, height:24, borderRadius:12, background: form.available ? C.purple : "rgba(255,255,255,0.1)", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}
                >
                  <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left: form.available ? 23 : 3, transition:"left 0.2s" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── ACCOUNT TAB ── */}
          {tab === "Account" && (
            <div>
              <p style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Account Details</p>
              <label style={LABEL_STYLE}>Email Address</label>
              <input style={{ ...INPUT_STYLE, opacity:0.6, cursor:"not-allowed" }} value={firebaseUser?.email || ""} readOnly />
              <p style={{ fontSize:12, color:C.muted, marginTop:-10, marginBottom:16 }}>Email is managed through Firebase Auth and cannot be changed here.</p>

              <label style={LABEL_STYLE}>Account UID</label>
              <input style={{ ...INPUT_STYLE, opacity:0.5, cursor:"not-allowed", fontFamily:"monospace", fontSize:11 }} value={uid || ""} readOnly />

              <div style={{ marginTop:12, padding:"14px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#ef4444", marginBottom:4 }}>Danger Zone</p>
                <p style={{ fontSize:12, color:C.muted }}>To delete your account, please contact support.</p>
              </div>
            </div>
          )}

          {tab === "Notifications" && <NotificationsTab notifs={notifs} onChange={setNotifs} />}
          {tab === "Privacy"       && <PrivacyTab       privacy={privacy} onChange={setPrivacy} />}

          {/* ── PAYMENTS TAB ── */}
          {tab === "Payments" && (
            <div>
              <p style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Payment Settings</p>
              <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>View your payment history in the <strong style={{ color:"#a78bfa" }}>Payments</strong> section of the sidebar.</p>
              <div style={{ padding:"20px", background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:12 }}>
                <p style={{ fontSize:13, color:C.muted }}>Withdrawal and payout bank details — coming soon.</p>
              </div>
            </div>
          )}

          {/* Save button — only relevant tabs */}
          {["Profile","Notifications","Privacy"].includes(tab) && (
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:24, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{ background: saving ? "#4c1d95" : C.purple, color:"#fff", border:"none", padding:"11px 28px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'Sora',sans-serif", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
