"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatsCards from "@/components/dashboard/StatsCards";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import NotificationsWidget from "@/components/dashboard/NotificationsWidget";
import LanguageStats from "@/components/dashboard/LanguageStats";

const FREE_MONTHLY_LIMIT = 3;

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("Dashboard");

  // ── User state ──
  const [uid,           setUid]           = useState("");
  const isFreelancer = useIsFreelancer(uid || undefined);
  const [userName,      setUserName]      = useState("");
  const [userInitial,   setUserInitial]   = useState("U");
  const [userPhoto,     setUserPhoto]     = useState("");
  const [userPlan,        setUserPlan]        = useState("Free Plan");
  const [authLoading,     setAuthLoading]     = useState(true);
  const [aiPostCount,     setAiPostCount]     = useState(0);
  const [emailVerified,   setEmailVerified]   = useState(true);
  const [firebaseUser,    setFirebaseUser]    = useState<any>(null);
  const [resendLoading,   setResendLoading]   = useState(false);
  const [resendSuccess,   setResendSuccess]   = useState(false);

  // ── Fetch logged-in user from Firebase ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      setFirebaseUser(user);
      setEmailVerified(user.emailVerified);

      // Load user profile
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const name = data.fullName || user.displayName || "User";
          setUserName(name);
          setUserInitial((name.charAt(0) || "U").toUpperCase());
          setUserPhoto(data.profilePhoto || user.photoURL || "");
          setUserPlan(
            data.plan === "pro"      ? "Pro Plan"      :
            data.plan === "business" ? "Business Plan" : "Free Plan"
          );
        } else {
          const name = user.displayName || "User";
          setUserName(name);
          setUserInitial((name.charAt(0) || "U").toUpperCase());
          setUserPhoto(user.photoURL || "");
        }
      } catch {
        setUserName(user.displayName || "User");
        setUserInitial((user.displayName?.charAt(0) || "U").toUpperCase());
      }

      // Count this month's AI posts for the upgrade banner
      try {
        const start = new Date();
        start.setDate(1); start.setHours(0, 0, 0, 0);
        const aiSnap = await getDocs(
          query(collection(db, "ai_content"), where("userId", "==", user.uid))
        );
        const monthlyCount = aiSnap.docs.filter(d => {
          const ts = d.data().createdAt;
          const date = ts?.toDate ? ts.toDate() : new Date(ts);
          return date >= start;
        }).length;
        setAiPostCount(monthlyCount);
      } catch { /* non-critical */ }

      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Loading screen ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse text-xl font-bold text-white">
            DM
          </div>
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const atLimit   = aiPostCount >= FREE_MONTHLY_LIMIT && userPlan === "Free Plan";
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - aiPostCount);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">

      <Sidebar
        sidebarOpen={sidebarOpen}
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        userName={userName}
        userInitial={userInitial}
        userPhoto={userPhoto}
        userPlan={userPlan}
        isFreelancer={isFreelancer}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName}
          userInitial={userInitial}
          userPhoto={userPhoto}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Email verification banner */}
          {!emailVerified && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-sm font-bold text-amber-400">Please verify your email address</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check your inbox for the verification link. Some features may be limited until verified.</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!firebaseUser || resendLoading) return;
                  setResendLoading(true);
                  try {
                    await sendEmailVerification(firebaseUser, { url: window.location.href });
                    setResendSuccess(true);
                    setTimeout(() => setResendSuccess(false), 5000);
                  } catch { /* rate-limited */ }
                  finally { setResendLoading(false); }
                }}
                disabled={resendLoading || resendSuccess}
                className="flex-shrink-0 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {resendSuccess ? "✅ Sent!" : resendLoading ? "Sending…" : "Resend Email"}
              </button>
            </div>
          )}

          {/* Upgrade Banner — only shown on Free Plan */}
          {userPlan === "Free Plan" && (
            <div className={`border rounded-2xl px-5 py-4 flex items-center justify-between ${
              atLimit
                ? "bg-red-600/15 border-red-500/30"
                : "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/30"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{atLimit ? "⚠️" : "🚀"}</span>
                <div>
                  <div className="text-sm font-bold">
                    {atLimit
                      ? "Monthly limit reached — upgrade to keep generating!"
                      : "Upgrade to Pro for unlimited AI posts!"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {atLimit
                      ? `You've used all ${FREE_MONTHLY_LIMIT} free AI posts this month.`
                      : `You have used ${aiPostCount} of ${FREE_MONTHLY_LIMIT} free AI posts this month. ${remaining} remaining.`}
                  </div>
                </div>
              </div>
              <Link href="/dashboard/settings?tab=billing"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0">
                Upgrade →
              </Link>
            </div>
          )}

          <StatsCards uid={uid} />
          <QuickActions />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentActivity uid={uid} />
            <NotificationsWidget />
          </div>

          <LanguageStats />

        </main>
      </div>
    </div>
  );
}
