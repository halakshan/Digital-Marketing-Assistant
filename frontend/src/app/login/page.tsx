"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthLogo from "@/components/auth/AuthLogo";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthDivider from "@/components/auth/AuthDivider";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");

  // ── Get user role from Firestore and redirect ──
  const redirectByRole = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    const role = snap.exists() ? snap.data().role : "business";
    router.push(role === "freelancer" ? "/freelancer" : "/dashboard");
  };

  // ── Email / Password ──
  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await redirectByRole(cred.user.uid);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google ──
  const handleGoogleLogin = async () => {
    setError("");
    setGLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      const user     = cred.user;

      // Create Firestore doc if this is a first-time Google user
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid:          user.uid,
          fullName:     user.displayName || "",
          email:        user.email       || "",
          businessName: "",
          phone:        "",
          role:         "business",
          plan:         "free",
          language:     "en",
          profilePhoto: user.photoURL   || "",
          createdAt:    serverTimestamp(),
          updatedAt:    serverTimestamp(),
        });
      }

      await redirectByRole(user.uid);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        <AuthLogo
          title="Welcome back"
          subtitle="Sign in to your account to continue"
        />

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur shadow-2xl">

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <GoogleButton onClick={handleGoogleLogin} loading={gLoading} />
          <AuthDivider />
          <LoginForm
            email={email}       setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPass={showPass} setShowPass={setShowPass}
            loading={loading}
            onSubmit={handleEmailLogin}
          />
        </div>

        {/* Register link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Create an account →
          </Link>
        </p>

      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":   return "Invalid email or password.";
    case "auth/too-many-requests":    return "Too many attempts. Please wait and try again.";
    case "auth/user-disabled":        return "This account has been disabled.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    default:                          return "Something went wrong. Please try again.";
  }
}