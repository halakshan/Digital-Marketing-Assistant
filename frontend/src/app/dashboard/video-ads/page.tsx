"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar        from "@/components/dashboard/Sidebar";
import Topbar         from "@/components/dashboard/Topbar";
import AdStyleSelector from "@/components/video-ads/AdStyleSelector";
import AdOptions       from "@/components/video-ads/AdOptions";
import ProductForm     from "@/components/video-ads/ProductForm";
import VideoTips       from "@/components/video-ads/VideoTips";
import VideoUsageBar   from "@/components/video-ads/VideoUsageBar";
import RecentVideos    from "@/components/video-ads/RecentVideos";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/video`;

interface Scene {
  id: number;
  timeCode: string;
  visual: string;
  textOverlay: string;
  voiceover: string;
  transition: string;
  imageData?: string | null;
}

interface ScriptData {
  title?: string;
  hook?: string;
  scenes?: Scene[];
  callToAction?: string;
  hashtags?: string[];
}

type Step = "form" | "script" | "generating-video" | "done";

export default function VideoAdsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink,  setActiveLink]  = useState("Video Ads");

  // Form
  const [adStyle,  setAdStyle]  = useState("cinematic");
  const [platform, setPlatform] = useState("instagram_reels");
  const [language, setLanguage] = useState("English");
  const [duration, setDuration] = useState("30 seconds");
  const [mood,     setMood]     = useState("Exciting");
  const [product,  setProduct]  = useState("");
  const [audience, setAudience] = useState("");
  const [keyMsg,   setKeyMsg]   = useState("");

  // State
  const [step,         setStep]         = useState<Step>("form");
  const [loading,      setLoading]      = useState(false);
  const [script,       setScript]       = useState("");
  const [scriptData,   setScriptData]   = useState<ScriptData>({});
  const [jobId,        setJobId]        = useState("");
  const [scenes,       setScenes]       = useState<Scene[]>([]);
  const [canvasW,      setCanvasW]      = useState(1080);
  const [canvasH,      setCanvasH]      = useState(1920);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState("");
  const [creatingVideo,setCreatingVideo] = useState(false);
  const [videoProgress,setVideoProgress] = useState(0);
  const [videoBlob,    setVideoBlob]    = useState<Blob | null>(null);

  // User
  const [userName,     setUserName]     = useState("");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [usageRefresh, setUsageRefresh] = useState(0);
  const [histRefresh,  setHistRefresh]  = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const name = d.fullName || user.displayName || "User";
          setUserName(name); setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
          setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
        }
      } catch { setUserName(user.displayName || "User"); }
    });
    return () => unsub();
  }, [router]);

  const getToken = async () => {
    if (!firebaseUser) throw new Error("Not authenticated");
    return getIdToken(firebaseUser);
  };

  // ── Step 1: Generate script ──
  const handleGenerate = async () => {
    if (!product.trim() || !audience.trim() || !firebaseUser) return;
    setLoading(true); setError(""); setScript(""); setScenes([]); setVideoBlob(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adStyle, platform, language, duration, mood, product, audience, keyMessage: keyMsg }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to generate script"); return; }
      setScript(data.script);
      setScriptData(data.scriptData || {});
      setJobId(data.jobId);
      setStep("script");
      setUsageRefresh(n => n + 1);
    } catch { setError("Failed to connect to server. Make sure backend is running."); }
    finally { setLoading(false); }
  };

  // ── Step 2: Generate scene images + create video ──
  const handleGenerateVideo = async () => {
    if (!jobId || !firebaseUser) return;
    setStep("generating-video"); setError("");
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to generate scenes"); setStep("script"); return; }

      const generatedScenes: Scene[] = data.scenesWithImages || [];
      setScenes(generatedScenes);
      setCanvasW(data.canvasWidth  || 1080);
      setCanvasH(data.canvasHeight || 1920);
      setStep("done");
      setHistRefresh(n => n + 1);
    } catch { setError("Failed to generate video scenes."); setStep("script"); }
  };

  // ── Create video from scene images using canvas + MediaRecorder ──
  const handleCreateVideo = async () => {
    if (!scenes.length || creatingVideo) return;
    setCreatingVideo(true); setVideoProgress(0); setVideoBlob(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width  = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;

      // Check MediaRecorder support
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const stream   = canvas.captureStream(25);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
      const chunks:  Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      // Set up the stop handler BEFORE starting — waits for recorder.stop()
      const blobReady = new Promise<Blob>(resolve => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start(100);

      // Draw each scene for 4 seconds (or based on duration)
      const totalSecs    = parseInt(duration) || 30;
      const secsPerScene = Math.max(3, Math.floor(totalSecs / scenes.length));
      const fps          = 25;
      const framesPerScene = secsPerScene * fps;

      const validScenes = scenes.filter(s => s.imageData);

      if (validScenes.length === 0) {
        // No images — draw text slides
        for (let si = 0; si < scenes.length; si++) {
          const sc = scenes[si];
          for (let f = 0; f < framesPerScene; f++) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, "#0a0a14"); grad.addColorStop(1, "#1a0a2e");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white"; ctx.font = `bold ${canvas.width * 0.05}px Arial`;
            ctx.textAlign = "center";
            wrapText(ctx, sc.textOverlay || sc.visual, canvas.width / 2, canvas.height / 2, canvas.width * 0.8, canvas.width * 0.06);
            await sleep(1000 / fps);
          }
          setVideoProgress(Math.round(((si + 1) / scenes.length) * 90));
        }
      } else {
        for (let si = 0; si < validScenes.length; si++) {
          const sc  = validScenes[si];
          const img = await loadImage(sc.imageData!);

          for (let f = 0; f < framesPerScene; f++) {
            const progress = f / framesPerScene;

            // Ken Burns effect: slow zoom-in
            const scale = 1 + progress * 0.06;
            const dx    = canvas.width  * (scale - 1) / 2;
            const dy    = canvas.height * (scale - 1) / 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, -dx, -dy, canvas.width * scale, canvas.height * scale);

            // Dark gradient overlay at bottom
            const grad = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,0.85)");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scene dot indicators
            const dotY = canvas.height * 0.08;
            validScenes.forEach((_, di) => {
              ctx.beginPath();
              ctx.arc(canvas.width / 2 + (di - validScenes.length / 2 + 0.5) * 24, dotY, di === si ? 7 : 5, 0, Math.PI * 2);
              ctx.fillStyle = di === si ? "#7c3aed" : "rgba(255,255,255,0.3)";
              ctx.fill();
            });

            // Text overlay (fade in)
            const textOpacity = Math.min(1, progress * 4);
            if (sc.textOverlay) {
              ctx.globalAlpha = textOpacity;
              ctx.fillStyle   = "white";
              ctx.font        = `bold ${Math.round(canvas.width * 0.052)}px Arial`;
              ctx.textAlign   = "center";
              ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 20;
              wrapText(ctx, sc.textOverlay, canvas.width / 2, canvas.height * 0.82, canvas.width * 0.85, canvas.width * 0.065);
              ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            }

            // Voiceover subtitle
            if (sc.voiceover) {
              ctx.globalAlpha = textOpacity * 0.8;
              ctx.fillStyle   = "rgba(255,255,255,0.75)";
              ctx.font        = `${Math.round(canvas.width * 0.032)}px Arial`;
              ctx.textAlign   = "center";
              wrapText(ctx, sc.voiceover, canvas.width / 2, canvas.height * 0.91, canvas.width * 0.8, canvas.width * 0.038);
              ctx.globalAlpha = 1;
            }

            // Branding bar at top
            ctx.fillStyle = "rgba(124,58,237,0.9)";
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.055);
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.round(canvas.width * 0.032)}px Arial`;
            ctx.textAlign = "left";
            ctx.fillText(product, canvas.width * 0.04, canvas.height * 0.038);

            await sleep(1000 / fps);
          }

          // White flash transition between scenes
          for (let f = 0; f < 8; f++) {
            ctx.fillStyle = `rgba(255,255,255,${f < 4 ? (f / 4) * 0.6 : ((8 - f) / 4) * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await sleep(1000 / fps);
          }

          setVideoProgress(Math.round(((si + 1) / validScenes.length) * 90));
        }
      }

      // CTA final frame (2.5 seconds)
      const grad2 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad2.addColorStop(0, "#4c1d95"); grad2.addColorStop(1, "#1e3a8a");
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white"; ctx.textAlign = "center";
      ctx.font = `bold ${Math.round(canvas.width * 0.08)}px Arial`;
      ctx.fillText(scriptData.callToAction || "Shop Now!", canvas.width / 2, canvas.height * 0.45);
      ctx.font = `${Math.round(canvas.width * 0.042)}px Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(product, canvas.width / 2, canvas.height * 0.55);
      await sleep(2500);

      // Stop recording and wait for the blob
      recorder.stop();
      const blob = await blobReady;
      setVideoBlob(blob);
      setVideoProgress(100);
    } catch (e: any) {
      setError("Failed to create video: " + e.message);
    } finally {
      setCreatingVideo(false);
    }
  };

  // ── Download video ──
  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `${product.replace(/\s+/g, "-").slice(0, 30)}-video-ad.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Download script ──
  const handleDownloadScript = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${product.slice(0, 20).replace(/\s+/g, "-")}-script.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("form"); setScript(""); setScriptData({}); setJobId("");
    setScenes([]); setVideoBlob(null); setError(""); setVideoProgress(0);
    setProduct(""); setAudience(""); setKeyMsg("");
    setHistRefresh(n => n + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan} isFreelancer={isFreelancer}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}/>

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          <div className="mb-2">
            <h1 className="text-lg font-bold">🎬 AI Video Ad Generator</h1>
            <p className="text-xs text-gray-400">Generate a script → get AI scene images → create & download your video</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="space-y-5">
              {step === "form" && (
                <>
                  <AdStyleSelector adStyle={adStyle} setAdStyle={setAdStyle} />
                  <AdOptions platform={platform} setPlatform={setPlatform}
                    duration={duration} setDuration={setDuration}
                    language={language} setLanguage={setLanguage}
                    mood={mood} setMood={setMood}/>
                  <ProductForm product={product} setProduct={setProduct}
                    audience={audience} setAudience={setAudience}
                    keyMsg={keyMsg} setKeyMsg={setKeyMsg}
                    loading={loading} onGenerate={handleGenerate}/>
                </>
              )}

              {(step === "script" || step === "generating-video" || step === "done") && (
                <div className="space-y-4">
                  {/* Tags */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-200">Ad Configuration</h3>
                      <button onClick={handleReset} className="text-xs text-gray-500 hover:text-white">← Start over</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[adStyle, platform.replace(/_/g,""), language, duration, mood].map((t,i) => (
                        <span key={i} className="text-xs bg-white/10 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg capitalize">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Script */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-200">✅ Script Generated</h3>
                      <div className="flex gap-2">
                        <button onClick={handleCopy}
                          className="text-xs bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 text-pink-300 px-3 py-1.5 rounded-lg transition-all">
                          {copied ? "✓ Copied!" : "📋 Copy"}
                        </button>
                        <button onClick={handleDownloadScript}
                          className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition-all">
                          📄 Download Script
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {script}
                    </div>
                  </div>

                  {/* Generate Video button */}
                  {step === "script" && (
                    <button onClick={handleGenerateVideo}
                      className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-pink-900/30 flex items-center justify-center gap-2">
                      🎬 Generate Scene Images & Create Video
                    </button>
                  )}

                  {/* Generating scenes */}
                  {step === "generating-video" && (
                    <div className="bg-pink-600/10 border border-pink-500/30 rounded-2xl p-6 text-center">
                      <div className="w-14 h-14 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                      <p className="font-bold mb-1">Generating scene images...</p>
                      <p className="text-xs text-gray-400">AI is creating visuals for each scene. This takes ~30 seconds.</p>
                    </div>
                  )}

                  {/* Scene images + video creation */}
                  {step === "done" && scenes.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-gray-200 mb-3">🎞️ Scene Images ({scenes.filter(s=>s.imageData).length}/{scenes.length})</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {scenes.map((sc, i) => (
                            <div key={i} className="relative rounded-xl overflow-hidden border border-white/10 aspect-square bg-white/5">
                              {sc.imageData
                                ? <img src={sc.imageData} alt={`Scene ${sc.id}`} className="w-full h-full object-cover"/>
                                : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No image</div>
                              }
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                                <p className="text-white text-[10px] font-bold truncate">{sc.timeCode}</p>
                                <p className="text-gray-400 text-[9px] truncate">{sc.textOverlay || sc.visual?.slice(0,30)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Create Video */}
                      {!videoBlob ? (
                        <div className="space-y-3">
                          <button onClick={handleCreateVideo} disabled={creatingVideo}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-base transition-all shadow-xl flex items-center justify-center gap-2">
                            {creatingVideo
                              ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating Video... {videoProgress}%</>
                              : "🎬 Create Downloadable Video"}
                          </button>
                          {creatingVideo && (
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${videoProgress}%` }}/>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 text-center">Creates a .webm video file with Ken Burns effect & text overlays</p>
                        </div>
                      ) : (
                        <div className="bg-green-600/10 border border-green-500/30 rounded-2xl p-5 text-center space-y-3">
                          <div className="text-4xl">🎉</div>
                          <p className="font-bold text-green-400 text-base">Video Ready!</p>
                          <p className="text-xs text-gray-400">Your {duration} video ad has been created with {scenes.filter(s=>s.imageData).length} scenes.</p>
                          <div className="flex gap-3 justify-center">
                            <button onClick={handleDownloadVideo}
                              className="bg-green-600 hover:bg-green-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
                              ⬇️ Download Video (.webm)
                            </button>
                            <button onClick={handleCreateVideo} disabled={creatingVideo}
                              className="bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-gray-300 transition-all">
                              🔄 Recreate
                            </button>
                          </div>
                          <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-300 mt-1">+ Create New Ad</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              <VideoTips />
              <VideoUsageBar firebaseUser={firebaseUser} refresh={usageRefresh}/>
              <RecentVideos  firebaseUser={firebaseUser} refresh={histRefresh}/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = (text || "").split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line  = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
}
