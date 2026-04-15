"use client";

import { useState, useEffect } from "react";
import {
  reauthenticateWithCredential, EmailAuthProvider, updatePassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, collection, getDocs, deleteDoc, updateDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Toggle from "./Toggle";

// ── TOTP helpers (Web Crypto API — no library needed) ─────────────────────────

function base32ToBytes(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const result: number[] = [];
  let buffer = 0, bitsLeft = 0;
  for (const char of base32.toUpperCase().replace(/=+$/, "")) {
    const val = alphabet.indexOf(char);
    if (val < 0) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      result.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  return new Uint8Array(result);
}

async function generateTOTP(secret: string): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { counterBytes[i] = c & 0xff; c = Math.floor(c / 256); }
  const keyBytes = base32ToBytes(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig  = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
  const hash = new Uint8Array(sig);
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset]     & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) <<  8) |
     (hash[offset + 3] & 0xff)
  );
  return (code % 1_000_000).toString().padStart(6, "0");
}

function generateBase32Secret(): string {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes).map(b => alpha[b % 32]).join("").slice(0, 16);
}

function parseUserAgent(ua: string): { device: string; icon: string } {
  const mobile = /iPhone|Android|iPad/i.test(ua);
  const browser =
    /Chrome/i.test(ua)  ? "Chrome"  :
    /Firefox/i.test(ua) ? "Firefox" :
    /Safari/i.test(ua)  ? "Safari"  :
    /Edge/i.test(ua)    ? "Edge"    : "Browser";
  const os =
    /Windows/i.test(ua) ? "Windows" :
    /Mac/i.test(ua)     ? "macOS"   :
    /iPhone/i.test(ua)  ? "iPhone"  :
    /Android/i.test(ua) ? "Android" :
    /Linux/i.test(ua)   ? "Linux"   : "Unknown OS";
  return {
    device: `${browser} on ${os}`,
    icon:   mobile ? "📱" : "💻",
  };
}

function timeAgo(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} hr ago`;
  return d.toLocaleDateString();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SecurityTab() {
  const [user,        setUser]        = useState<any>(null);
  const [uid,         setUid]         = useState("");

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg,     setPassMsg]     = useState("");

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret,  setTwoFASecret]  = useState("");
  const [twoFAQrUrl,   setTwoFAQrUrl]   = useState("");
  const [twoFACode,    setTwoFACode]    = useState("");
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg,     setTwoFAMsg]     = useState("");

  // Sessions
  const [sessions,          setSessions]          = useState<any[]>([]);
  const [currentSessionId,  setCurrentSessionId]  = useState("");
  const [sessionsLoading,   setSessionsLoading]   = useState(true);

  // ── Load data on mount ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      setUid(u.uid);

      // 2FA status
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setTwoFAEnabled(d.twoFAEnabled || false);
          if (d.twoFASecret) setTwoFASecret(d.twoFASecret);
        }
      } catch { /* ignore */ }

      // Current session from localStorage
      const sid = localStorage.getItem("sessionId");
      if (sid) setCurrentSessionId(sid);

      // Load sessions
      loadSessions(u.uid);
    });
    return () => unsub();
  }, []);

  const loadSessions = async (userId: string) => {
    setSessionsLoading(true);
    try {
      const snap = await getDocs(collection(db, "users", userId, "sessions"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return tb.getTime() - ta.getTime();
      });
      setSessions(list);
    } catch { /* ignore */ }
    finally { setSessionsLoading(false); }
  };

  const showPassMsg = (msg: string) => {
    setPassMsg(msg);
    setTimeout(() => setPassMsg(""), 4000);
  };
  const show2FAMsgFn = (msg: string) => {
    setTwoFAMsg(msg);
    setTimeout(() => setTwoFAMsg(""), 4000);
  };

  // ── Change Password ──
  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPass || !newPass || !confirmPass) {
      showPassMsg("❌ Please fill in all fields.");
      return;
    }
    if (newPass !== confirmPass) {
      showPassMsg("❌ New passwords don't match.");
      return;
    }
    if (newPass.length < 6) {
      showPassMsg("❌ Password must be at least 6 characters.");
      return;
    }
    if (newPass === currentPass) {
      showPassMsg("❌ New password must be different from current.");
      return;
    }
    setPassLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      showPassMsg("✅ Password updated successfully!");
    } catch (err: any) {
      showPassMsg(
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "❌ Current password is incorrect."
          : "❌ " + err.message
      );
    } finally {
      setPassLoading(false);
    }
  };

  // ── Setup 2FA ──
  const handleBeginSetup2FA = () => {
    const secret = generateBase32Secret();
    setTwoFASecret(secret);
    setTwoFACode("");
    const email = user?.email || "user@dmasssistant.com";
    const uri   = `otpauth://totp/DM%20Assistant:${encodeURIComponent(email)}?secret=${secret}&issuer=DM%20Assistant&algorithm=SHA1&digits=6&period=30`;
    setTwoFAQrUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uri)}&size=200x200&margin=10`);
    setShow2FASetup(true);
    setTwoFAMsg("");
  };

  const handleVerify2FA = async () => {
    if (!user || !twoFACode.trim()) return;
    setTwoFALoading(true);
    try {
      // Check current window ±1 window for clock drift
      const expected1 = await generateTOTP(twoFASecret);
      const clockDrift = new Date();
      clockDrift.setSeconds(clockDrift.getSeconds() + 30);
      const counter2 = Math.floor(clockDrift.getTime() / 1000 / 30);
      const counterBytes = new Uint8Array(8);
      let c = counter2;
      for (let i = 7; i >= 0; i--) { counterBytes[i] = c & 0xff; c = Math.floor(c / 256); }
      const keyBytes  = base32ToBytes(twoFASecret);
      const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
      const sig       = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
      const hash      = new Uint8Array(sig);
      const offset    = hash[hash.length - 1] & 0x0f;
      const code      = (((hash[offset] & 0x7f) << 24) | (hash[offset+1] << 16) | (hash[offset+2] << 8) | hash[offset+3]);
      const expected2 = (code % 1_000_000).toString().padStart(6, "0");

      if (twoFACode === expected1 || twoFACode === expected2) {
        await updateDoc(doc(db, "users", uid), {
          twoFAEnabled: true, twoFASecret, updatedAt: serverTimestamp(),
        });
        setTwoFAEnabled(true);
        setShow2FASetup(false);
        setTwoFACode("");
        show2FAMsgFn("✅ Two-factor authentication enabled!");
      } else {
        show2FAMsgFn("❌ Invalid code. Check your authenticator app and try again.");
      }
    } catch (err: any) {
      show2FAMsgFn("❌ Verification failed: " + err.message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        twoFAEnabled: false, twoFASecret: "", updatedAt: serverTimestamp(),
      });
      setTwoFAEnabled(false);
      setShow2FASetup(false);
      show2FAMsgFn("2FA has been disabled.");
    } catch (err: any) {
      show2FAMsgFn("❌ " + err.message);
    }
  };

  // ── Revoke Session ──
  const handleRevokeSession = async (sessionId: string) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid, "sessions", sessionId));
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch { /* ignore */ }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Change Password ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-bold mb-1">Change Password</h3>
        <p className="text-xs text-gray-400 mb-5">Use a strong password you don&apos;t use elsewhere.</p>

        {passMsg && (
          <div className={`text-xs px-4 py-3 rounded-xl border font-semibold mb-4 ${
            passMsg.startsWith("❌")
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-green-500/10 border-green-500/20 text-green-400"
          }`}>{passMsg}</div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Current Password</label>
            <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
          </div>
          <button type="button" onClick={handleChangePassword} disabled={passLoading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            {passLoading
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating...</>
              : "🔒 Update Password"}
          </button>
        </div>
      </div>

      {/* ── Two-Factor Authentication ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-sm font-bold">Two-Factor Authentication</div>
            <div className="text-xs text-gray-400 mt-0.5">Add an extra layer of security with an authenticator app</div>
          </div>
          <Toggle enabled={twoFAEnabled} onChange={twoFAEnabled ? handleDisable2FA : handleBeginSetup2FA} />
        </div>

        {twoFAMsg && (
          <div className={`text-xs px-4 py-3 rounded-xl border font-semibold mt-3 ${
            twoFAMsg.startsWith("❌")
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-green-500/10 border-green-500/20 text-green-400"
          }`}>{twoFAMsg}</div>
        )}

        {twoFAEnabled && !show2FASetup && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 flex items-center gap-2">
            <span>✅</span>
            <span>Two-factor authentication is <strong>enabled</strong>. Your account is protected.</span>
          </div>
        )}

        {/* Setup flow */}
        {show2FASetup && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
            <p className="text-xs text-gray-300 font-semibold">📱 Step 1: Scan this QR code with your authenticator app</p>
            <p className="text-xs text-gray-400">Use Google Authenticator, Authy, or any TOTP-compatible app.</p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* QR code */}
              <div className="bg-white p-2 rounded-xl flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={twoFAQrUrl} alt="2FA QR Code" width={160} height={160}
                  className="rounded-lg" />
              </div>

              {/* Manual entry key */}
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1.5">Or enter this key manually:</p>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-violet-300 tracking-widest break-all select-all">
                  {twoFASecret.match(/.{1,4}/g)?.join(" ") || twoFASecret}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Account: <span className="text-gray-300">{user?.email}</span><br/>
                  Issuer: DM Assistant
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-300 font-semibold mb-3">🔢 Step 2: Enter the 6-digit code from your app</p>
              <div className="flex gap-3">
                <input type="text" inputMode="numeric" maxLength={6} value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && twoFACode.length === 6 && handleVerify2FA()}
                  placeholder="000000"
                  className="w-36 bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all text-center font-mono tracking-widest text-lg" />
                <button type="button" onClick={handleVerify2FA}
                  disabled={twoFACode.length !== 6 || twoFALoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                  {twoFALoading
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Verifying...</>
                    : "✅ Verify & Enable"}
                </button>
                <button type="button" onClick={() => { setShow2FASetup(false); setTwoFACode(""); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Sessions ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold">Active Sessions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Devices where you&apos;re currently logged in</p>
          </div>
          <button type="button" onClick={() => uid && loadSessions(uid)}
            className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
            🔄 Refresh
          </button>
        </div>

        {sessionsLoading ? (
          <div className="text-center py-6 text-gray-500 text-xs">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">
            No sessions recorded yet. Sessions are created when you log in.
          </div>
        ) : (
          <div className="space-y-0">
            {sessions.map((s: any) => {
              const { device, icon } = parseUserAgent(s.deviceInfo || s.userAgent || "");
              const isCurrent = s.id === currentSessionId;
              return (
                <div key={s.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{device}</div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(s.createdAt)}
                      {s.location ? ` · ${s.location}` : ""}
                    </div>
                  </div>
                  {isCurrent
                    ? <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg flex-shrink-0">Current</span>
                    : (
                      <button type="button" onClick={() => handleRevokeSession(s.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-2 py-1 rounded-lg transition-all flex-shrink-0">
                        Revoke
                      </button>
                    )
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
