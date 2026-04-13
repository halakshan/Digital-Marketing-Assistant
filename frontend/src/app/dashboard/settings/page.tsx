"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar          from "@/components/dashboard/Sidebar";
import Topbar           from "@/components/dashboard/Topbar";
import SettingsNav      from "@/components/settings/SettingsNav";
import ProfileTab       from "@/components/settings/ProfileTab";
import BusinessTab      from "@/components/settings/BusinessTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import BillingTab       from "@/components/settings/BillingTab";
import SecurityTab      from "@/components/settings/SecurityTab";

type NotifKeys = "aiContent"|"campaigns"|"freelancer"|"seo"|"payments"|"system"|"emailDigest"|"marketing";

export default function SettingsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("Settings");
  const [activeTab,   setActiveTab]   = useState(() => {
    const tab = searchParams.get("tab");
    return ["profile","business","notifications","billing","security"].includes(tab ?? "")
      ? (tab as string)
      : "profile";
  });
  const [saved,       setSaved]       = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Firebase user (for ProfileTab) ──
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);

  // ── User state for Sidebar/Topbar ──
  const [userName,    setUserName]    = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userPhoto,   setUserPhoto]   = useState("");
  const [userPlan,    setUserPlan]    = useState("Free Plan");
  const [firebaseUid, setFirebaseUid] = useState("");

  // ── Profile ──
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [language, setLanguage] = useState("English");

  // ── Business ──
  const [bizName,    setBizName]    = useState("");
  const [bizType,    setBizType]    = useState("");
  const [bizWebsite, setBizWebsite] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  // ── Notifications ──
  const [notifs, setNotifs] = useState<Record<NotifKeys, boolean>>({
    aiContent: true, campaigns: true, freelancer: true, seo: false,
    payments: true,  system: true,    emailDigest: false, marketing: false,
  });

  // ── Fetch user from Firebase on mount ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      setFirebaseUser(user);
      setFirebaseUid(user.uid);

      // ── Create / update session record ──
      try {
        const existingSessionId = localStorage.getItem("sessionId");
        if (!existingSessionId) {
          const sessionRef = await addDoc(collection(db, "users", user.uid, "sessions"), {
            deviceInfo: navigator.userAgent,
            createdAt:  serverTimestamp(),
            lastActive: serverTimestamp(),
          });
          localStorage.setItem("sessionId", sessionRef.id);
        } else {
          // Update lastActive silently
          await updateDoc(doc(db, "users", user.uid, "sessions", existingSessionId), {
            lastActive: serverTimestamp(),
          }).catch(() => {
            // Session doc was deleted (revoked) — create a new one
            localStorage.removeItem("sessionId");
          });
        }
      } catch { /* non-critical */ }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const fullName = d.fullName || user.displayName || "";
          // Sidebar/Topbar
          setUserName(fullName);
          setUserInitial((fullName.charAt(0) || user.email?.charAt(0) || "U").toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
          setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
          // Profile tab
          setName(fullName);
          setEmail(d.email || user.email || "");
          setPhone(d.phone || "");
          setLanguage(d.language === "si" ? "Sinhala" : d.language === "ta" ? "Tamil" : "English");
          // Business tab
          setBizName(d.businessName || "");
          setBizType(d.businessType || "");
          setBizWebsite(d.businessWebsite || "");
          setBizAddress(d.businessAddress || "");
          // Notifications
          if (d.notifications) setNotifs(d.notifications);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // ── Save to Firestore (business + notifications) ──
  const handleSave = async () => {
    if (!firebaseUid) return;
    try {
      await updateDoc(doc(db, "users", firebaseUid), {
        businessName:    bizName,
        businessType:    bizType,
        businessWebsite: bizWebsite,
        businessAddress: bizAddress,
        notifications:   notifs,
        updatedAt:       serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const toggleNotif = (key: NotifKeys) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse text-xl font-bold text-white">DM</div>
          <p className="text-gray-400 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

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

        <main className="flex-1 overflow-y-auto px-6 py-6">

          {/* Page title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold">⚙️ Settings</h1>
              <p className="text-xs text-gray-400">Manage your account, integrations and preferences</p>
            </div>
            {saved && (
              <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg font-semibold animate-pulse">
                ✓ Saved successfully!
              </span>
            )}
          </div>

          <div className="flex gap-6">
            <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 min-w-0">
              {activeTab === "profile" && firebaseUser && (
                <ProfileTab
                  firebaseUser={firebaseUser}
                  firebaseUid={firebaseUid}
                  name={name}         setName={setName}
                  email={email}
                  phone={phone}       setPhone={setPhone}
                  language={language} setLanguage={setLanguage}
                  userPhoto={userPhoto}
                  userInitial={userInitial}
                  onSave={() => {
                    setUserName(name);
                    setUserInitial((name.charAt(0) || "U").toUpperCase());
                  }}
                  onPhotoUpdated={(url) => setUserPhoto(url)}
                  onAccountDeleted={() => router.push("/")}
                />
              )}
              {activeTab === "business" && (
                <BusinessTab
                  bizName={bizName}       setBizName={setBizName}
                  bizType={bizType}       setBizType={setBizType}
                  bizWebsite={bizWebsite} setBizWebsite={setBizWebsite}
                  bizAddress={bizAddress} setBizAddress={setBizAddress}
                  onSave={handleSave}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsTab notifs={notifs} onToggle={toggleNotif} onSave={handleSave} />
              )}
              {activeTab === "billing"  && <BillingTab />}
              {activeTab === "security" && <SecurityTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
