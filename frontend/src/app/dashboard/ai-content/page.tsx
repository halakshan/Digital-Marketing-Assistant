"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar             from "@/components/dashboard/Sidebar";
import Topbar              from "@/components/dashboard/Topbar";
import UsageBar            from "@/components/ai-content/UsageBar";
import ContentTypeSelector from "@/components/ai-content/ContentTypeSelector";
import ContentSettings     from "@/components/ai-content/ContentSettings";
import ContentForm         from "@/components/ai-content/ContentForm";
import ContentOutput       from "@/components/ai-content/ContentOutput";
import ContentHistory      from "@/components/ai-content/ContentHistory";

export default function AIContentPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("AI Content");
  const [contentType, setContentType] = useState("post");
  const [platform,    setPlatform]    = useState("Instagram");
  const [language,    setLanguage]    = useState("English");
  const [tone,        setTone]        = useState("Professional");
  const [topic,       setTopic]       = useState("");
  const [keywords,    setKeywords]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState("");
  const [error,       setError]       = useState("");

  // ── User state ──
  const [userName,    setUserName]    = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userPhoto,   setUserPhoto]   = useState("");
  const [userPlan,    setUserPlan]    = useState("Free Plan");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);

  // ── Fetch user ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const name = data.fullName || user.displayName || "User";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(data.profilePhoto || user.photoURL || "");
          setUserPlan(data.plan === "pro" ? "Pro Plan" : data.plan === "business" ? "Business Plan" : "Free Plan");
        }
      } catch {
        const name = user.displayName || "User";
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      }
    });
    return () => unsub();
  }, [router]);

  // ── Generate with real AI ──
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (!firebaseUser)  return;

    setLoading(true);
    setResult("");
    setError("");

    try {
      // Get Firebase token to authenticate with backend
      const token = await getIdToken(firebaseUser);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType,
          platform,
          language,
          tone,
          topic,
          keywords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "AI generation failed");
        return;
      }

      setResult(data.result);

    } catch (err) {
      setError("Failed to connect to AI server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-6">
            <h1 className="text-lg font-bold">🤖 AI Content Generator</h1>
            <p className="text-xs text-gray-400">Generate posts, captions &amp; ad copy in Sinhala, Tamil or English</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <UsageBar />
              <ContentTypeSelector contentType={contentType} setContentType={setContentType} />
              <ContentSettings
                platform={platform} setPlatform={setPlatform}
                language={language} setLanguage={setLanguage}
                tone={tone}         setTone={setTone}
              />
              <ContentForm
                topic={topic}       setTopic={setTopic}
                keywords={keywords} setKeywords={setKeywords}
                loading={loading}   onGenerate={handleGenerate}
              />
            </div>
            <div className="space-y-5">
              <ContentOutput
                result={result}         loading={loading}
                language={language}     contentType={contentType}
                platform={platform}     tone={tone}
                onRegenerate={handleGenerate}
              />
              <ContentHistory />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
