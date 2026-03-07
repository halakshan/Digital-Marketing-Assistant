"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthLogo from "@/components/auth/AuthLogo";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleReset = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found":     setError("No account found with this email."); break;
        case "auth/invalid-email":      setError("Please enter a valid email address."); break;
        case "auth/too-many-requests":  setError("Too many attempts. Please wait and try again."); break;
        default:                        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <AuthLogo
          title="Reset your password"
          subtitle="We'll send a reset link to your email"
        />

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur shadow-2xl">

          {/* Success state */}
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                📧
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your inbox!</h2>
              <p className="text-gray-400 text-sm mb-6">
                We sent a password reset link to{" "}
                <span className="text-violet-400 font-semibold">{email}</span>.
                <br/>Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-semibold"
              >
                ← Send to a different email
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-blue-400 text-base mt-0.5">ℹ️</span>
                <p className="text-xs text-blue-300">
                  Enter the email address linked to your account and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-900/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Sending reset link...
                  </span>
                ) : "Send Reset Link →"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Back to Sign In →
          </Link>
        </p>
      </div>
    </div>
  );
}
