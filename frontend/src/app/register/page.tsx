"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthLogo from "@/components/auth/AuthLogo";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthDivider from "@/components/auth/AuthDivider";
import RoleSelector from "@/components/auth/RoleSelector";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName,    setFullName]    = useState("");
  const [bizName,     setBizName]     = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [role,        setRole]        = useState("business");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const [error,       setError]       = useState("");
  const [agreed,      setAgreed]      = useState(false);
  const [verifyBanner,setVerifyBanner]= useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // ── Save user to Firestore ──
  const saveUserToFirestore = async (uid: string, name: string, emailVal: string) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      fullName:     name,
      email:        emailVal,
      businessName: bizName || "",
      phone:        "",
      role,
      plan:         "free",
      language:     "en",
      profilePhoto: "",
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    });

    // If freelancer → create freelancer_profiles document with correct field names
    if (role === "freelancer") {
      await setDoc(doc(db, "freelancer_profiles", uid), {
        uid,
        fullName:        name,
        category:        "",
        skills:          [],
        bio:             "",
        rate:            "",
        location:        "",
        profilePhoto:    "",
        rating:          0,
        reviewCount:     0,
        totalEarnings:   0,
        completedOrders: 0,
        activeProjects:  0,
        available:       true,
        verified:        false,
        profileComplete: false,
        createdAt:       serverTimestamp(),
        updatedAt:       serverTimestamp(),
      });
    }
  };

  // ── Email / Password Register ──
  const handleSubmit = async () => {
    if (!fullName || !email || !password || !confirm) { setError("Please fill in all required fields."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (!agreed)               { setError("Please agree to the Terms of Service."); return; }
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await saveUserToFirestore(cred.user.uid, fullName, email);

      // Send Firebase email verification
      await sendEmailVerification(cred.user, {
        url: `${window.location.origin}${role === "freelancer" ? "/freelancer" : "/dashboard"}`,
      });

      // Send welcome + backend verification emails (non-blocking)
      const token = await cred.user.getIdToken();
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API}/api/users/welcome`,           { method: "POST", headers }),
        fetch(`${API}/api/users/send-verification`, { method: "POST", headers }),
      ]).catch(() => {}); // fire-and-forget

      setVerifyBanner(true);
      // Redirect after short delay so user sees the banner
      setTimeout(() => {
        router.push(role === "freelancer" ? "/freelancer/profile" : "/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google Register ──
  const handleGoogle = async () => {
    setError("");
    setGLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      const user     = cred.user;
      await saveUserToFirestore(user.uid, user.displayName || "", user.email || "");
      router.push(role === "freelancer" ? "/freelancer/profile" : "/dashboard");
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 left-10 w-[200px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        <AuthLogo
          title="Create your account"
          subtitle="Start marketing smarter — it's free"
        />

        {/* Email sent banner */}
        {verifyBanner && (
          <div className="bg-green-500/15 border border-green-500/30 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="text-sm font-bold text-green-400">Check your inbox!</p>
              <p className="text-xs text-gray-400 mt-1">
                We sent a verification link to <span className="text-green-400 font-semibold">{email}</span>. Redirecting you now…
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur shadow-2xl">

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <GoogleButton onClick={handleGoogle} loading={gLoading} />
          <AuthDivider text="or register with email" />
          <RoleSelector role={role} setRole={setRole} />
          <RegisterForm
            role={role}
            fullName={fullName}       setFullName={setFullName}
            bizName={bizName}         setBizName={setBizName}
            email={email}             setEmail={setEmail}
            password={password}       setPassword={setPassword}
            confirm={confirm}         setConfirm={setConfirm}
            showPass={showPass}       setShowPass={setShowPass}
            showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            agreed={agreed}           setAgreed={setAgreed}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Sign in →
          </Link>
        </p>

      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already registered. Try signing in.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/weak-password":        return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    default:                          return "Something went wrong. Please try again.";
  }
}