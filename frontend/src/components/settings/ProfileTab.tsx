"use client";

import { useState, useEffect, useRef } from "react";
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
// Note: updateProfile is used for displayName only — photoURL is stored in Firestore (base64 not accepted by Firebase Auth)
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  firebaseUser: any;
  firebaseUid:  string;
  name:         string; setName:     (v: string) => void;
  email:        string;
  phone:        string; setPhone:    (v: string) => void;
  language:     string; setLanguage: (v: string) => void;
  userPhoto:    string;
  userInitial:  string;
  onSave:           () => void;
  onPhotoUpdated:   (url: string) => void;
  onAccountDeleted: () => void;
}

export default function ProfileTab({
  firebaseUser, firebaseUid,
  name, setName, email, phone, setPhone, language, setLanguage,
  userPhoto, userInitial,
  onSave, onPhotoUpdated, onAccountDeleted,
}: Props) {
  const [photoPreview,     setPhotoPreview]     = useState(userPhoto);
  const [saving,           setSaving]           = useState(false);

  // Sync preview when userPhoto prop loads from Firestore (async after mount)
  useEffect(() => {
    if (userPhoto) setPhotoPreview(userPhoto);
  }, [userPhoto]);
  const [savedMsg,         setSavedMsg]         = useState("");
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [deletePassword,   setDeletePassword]   = useState("");
  const [deleteError,      setDeleteError]      = useState("");
  const [deleting,         setDeleting]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showMsg = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 3500);
  };

  // ── Photo: resize to 200×200 via Canvas → base64 → Firestore ──
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const size = 200;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        const sx  = (img.width  - min) / 2;
        const sy  = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        try {
          // Save to Firestore only — Firebase Auth photoURL rejects base64
          await updateDoc(doc(db, "users", firebaseUid), {
            profilePhoto: dataUrl, updatedAt: serverTimestamp(),
          });
          setPhotoPreview(dataUrl);
          onPhotoUpdated(dataUrl);
          showMsg("✅ Profile photo updated!");
        } catch (err: any) {
          showMsg("❌ Failed: " + err.message);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Remove photo ──
  const handleRemovePhoto = async () => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, "users", firebaseUid), {
        profilePhoto: "", updatedAt: serverTimestamp(),
      });
      setPhotoPreview("");
      onPhotoUpdated("");
      showMsg("✅ Profile photo removed.");
    } catch (err: any) {
      showMsg("❌ Failed: " + err.message);
    }
  };

  // ── Save profile info ──
  const handleSave = async () => {
    if (!firebaseUser || saving) return;
    setSaving(true);
    try {
      await updateProfile(firebaseUser, { displayName: name });
      await updateDoc(doc(db, "users", firebaseUid), {
        fullName:  name,
        phone,
        language:  language === "Sinhala" ? "si" : language === "Tamil" ? "ta" : "en",
        updatedAt: serverTimestamp(),
      });
      onSave();
      showMsg("✅ Profile saved successfully!");
    } catch (err: any) {
      showMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (!firebaseUser || !deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, deletePassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await deleteDoc(doc(db, "users", firebaseUid));
      await deleteUser(firebaseUser);
      onAccountDeleted();
    } catch (err: any) {
      setDeleteError(
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "Incorrect password. Please try again."
          : err.message
      );
      setDeleting(false);
    }
  };

  const initial = name?.charAt(0)?.toUpperCase() || userInitial;

  return (
    <div className="space-y-5">
      {savedMsg && (
        <div className={`text-xs px-4 py-3 rounded-xl border font-semibold ${
          savedMsg.startsWith("❌")
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-green-500/10 border-green-500/20 text-green-400"
        }`}>{savedMsg}</div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-bold mb-5">Profile Information</h3>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
          <div className="relative flex-shrink-0">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/40 shadow-lg shadow-violet-500/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-violet-500/20">
                {initial}
              </div>
            )}
            {/* Camera overlay on hover */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Change photo"
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl"
            >
              📷
            </button>
            {/* Edit badge */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Change photo"
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-sm transition-all shadow-lg border-2 border-[#0d0d1a]"
            >
              ✏️
            </button>
          </div>
          <div>
            <div className="text-base font-bold">{name || "Your Name"}</div>
            <div className="text-xs text-gray-400 mb-3">{email}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5"
              >
                📷 Change Photo
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5"
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Email Address</label>
            <input value={email} readOnly
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm outline-none cursor-not-allowed opacity-60" />
            <p className="text-xs text-gray-600 mt-1">Email is set during registration</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 123 4567"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Preferred Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all">
              <option value="English">English</option>
              <option value="Sinhala">Sinhala</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          className="mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
          {saving
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
            : "💾 Save Changes"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-base font-bold text-red-400 mb-2">⚠️ Danger Zone</h3>
        <p className="text-xs text-gray-400 mb-4">
          Once you delete your account, all your data (AI content, video ads, designs, campaigns) will be permanently removed. This cannot be undone.
        </p>
        <button type="button" onClick={() => setShowDeleteModal(true)}
          className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all">
          🗑️ Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-4xl text-center mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-red-400 text-center mb-2">Delete Account?</h3>
            <p className="text-xs text-gray-400 text-center mb-5">
              This will permanently delete your account and all data. Enter your password to confirm.
            </p>
            <input type="password" value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
              placeholder="Enter your password"
              className="w-full bg-white/5 border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all mb-3" />
            {deleteError && <p className="text-xs text-red-400 mb-3">⚠ {deleteError}</p>}
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteAccount}
                disabled={!deletePassword || deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
                {deleting
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</>
                  : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
