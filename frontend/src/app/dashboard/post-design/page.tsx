"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar           from "@/components/dashboard/Sidebar";
import Topbar            from "@/components/dashboard/Topbar";
import DesignSteps       from "@/components/post-design/DesignSteps";
import TemplateSelector  from "@/components/post-design/TemplateSelector";
import CustomizeForm     from "@/components/post-design/CustomizeForm";
import LivePreview       from "@/components/post-design/LivePreview";
import ExportPanel       from "@/components/post-design/ExportPanel";
import RecentDesigns     from "@/components/post-design/RecentDesigns";
import AIImageGenerator  from "@/components/post-design/AIImageGenerator";
import { TEMPLATES }     from "@/components/post-design/postDesignData";

type Step    = "select" | "customize" | "preview";
type TabMode = "templates" | "ai-image";

// Canva template search URLs per template name
const CANVA_URLS: Record<string, string> = {
  "Summer Sale":       "https://www.canva.com/templates/?query=summer+sale+instagram+post",
  "Product Launch":    "https://www.canva.com/templates/?query=product+launch+social+media",
  "Flash Sale":        "https://www.canva.com/templates/?query=flash+sale+instagram",
  "Food & Restaurant": "https://www.canva.com/templates/?query=food+restaurant+instagram+post",
  "Fashion Post":      "https://www.canva.com/templates/?query=fashion+instagram+post",
  "Real Estate":       "https://www.canva.com/templates/?query=real+estate+social+media",
  "Festival Special":  "https://www.canva.com/templates/?query=festival+celebration+post",
  "Health & Wellness": "https://www.canva.com/templates/?query=health+wellness+instagram",
  "Tech & Gadgets":    "https://www.canva.com/templates/?query=tech+gadget+product+post",
  "Beauty & Skincare": "https://www.canva.com/templates/?query=beauty+skincare+instagram",
  "Event Promotion":   "https://www.canva.com/templates/?query=event+promotion+social+media",
  "Quote / Motivation":"https://www.canva.com/templates/?query=motivational+quote+instagram",
};

export default function PostDesignPage() {
  const router = useRouter();

  // ── UI state ──
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [activeLink,       setActiveLink]       = useState("Post Design");
  const [tab,              setTab]              = useState<TabMode>("templates");
  const [activeCategory,   setActiveCategory]   = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedSize,     setSelectedSize]     = useState("Square");
  const [headline,         setHeadline]         = useState("");
  const [subtext,          setSubtext]          = useState("");
  const [ctaText,          setCtaText]          = useState("");
  const [brandName,        setBrandName]        = useState("");
  const [step,             setStep]             = useState<Step>("select");
  const [histRefresh,      setHistRefresh]      = useState(0);

  // ── User state ──
  const [userName,     setUserName]     = useState("");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);

  // Ref for html2canvas download
  const previewRef = useRef<HTMLDivElement>(null);

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

  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate);
  const canvaUrl = selectedTemplateData ? (CANVA_URLS[selectedTemplateData.name] || "https://www.canva.com/templates") : "https://www.canva.com/templates";

  const handleSelectTemplate = (id: number) => {
    setSelectedTemplate(id);
    setStep("customize");
  };

  const handleOpenCanva = () => window.open("https://www.canva.com/templates", "_blank");

  const handleNewDesign = () => {
    setStep("select");
    setHeadline(""); setSubtext(""); setCtaText(""); setBrandName("");
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar
        sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan}
        isFreelancer={isFreelancer}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">🎨 Post Design Studio</h1>
              <p className="text-xs text-gray-400">Design posts with Canva templates or generate AI images instantly</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/20 px-3 py-1.5 rounded-xl">
              <span className="text-sm">🎨</span>
              <span className="text-xs font-semibold text-white">Canva + AI Powered</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setTab("templates"); setStep("select"); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                tab === "templates"
                  ? "bg-white/15 border-white/40 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
              }`}>
              🎨 Canva Templates
            </button>
            <button type="button" onClick={() => setTab("ai-image")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                tab === "ai-image"
                  ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-white"
              }`}>
              🤖 AI Image Generator
            </button>
          </div>

          {/* ── Templates Tab ── */}
          {tab === "templates" && (
            <>
              <DesignSteps step={step} />

              {step === "select" && (
                <>
                  <TemplateSelector
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    onSelectTemplate={handleSelectTemplate}
                    onOpenCanva={handleOpenCanva}
                  />
                  <RecentDesigns firebaseUser={firebaseUser} refresh={histRefresh} />
                </>
              )}

              {step === "customize" && selectedTemplateData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CustomizeForm
                    template={selectedTemplateData}
                    selectedSize={selectedSize}   setSelectedSize={setSelectedSize}
                    headline={headline}           setHeadline={setHeadline}
                    subtext={subtext}             setSubtext={setSubtext}
                    ctaText={ctaText}             setCtaText={setCtaText}
                    brandName={brandName}         setBrandName={setBrandName}
                    onBack={() => setStep("select")}
                    onPreview={() => { if (headline.trim()) setStep("preview"); }}
                  />
                  <LivePreview
                    ref={previewRef}
                    template={selectedTemplateData}
                    selectedSize={selectedSize}
                    headline={headline} subtext={subtext} ctaText={ctaText} brandName={brandName}
                  />
                </div>
              )}

              {step === "preview" && selectedTemplateData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LivePreview
                    ref={previewRef}
                    template={selectedTemplateData}
                    selectedSize={selectedSize}
                    headline={headline} subtext={subtext} ctaText={ctaText} brandName={brandName}
                    large
                  />
                  <ExportPanel
                    onOpenCanva={handleOpenCanva}
                    onEdit={() => setStep("customize")}
                    onNewDesign={handleNewDesign}
                    firebaseUser={firebaseUser}
                    templateId={selectedTemplate ?? undefined}
                    templateName={selectedTemplateData.name}
                    headline={headline}
                    subtext={subtext}
                    ctaText={ctaText}
                    brandName={brandName}
                    size={selectedSize}
                    previewRef={previewRef}
                    canvaUrl={canvaUrl}
                  />
                </div>
              )}
            </>
          )}

          {/* ── AI Image Tab ── */}
          {tab === "ai-image" && (
            <AIImageGenerator
              firebaseUser={firebaseUser}
              onSaved={() => setHistRefresh(n => n + 1)}
            />
          )}

        </main>
      </div>
    </div>
  );
}
