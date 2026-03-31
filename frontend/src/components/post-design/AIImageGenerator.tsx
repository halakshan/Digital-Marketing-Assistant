"use client";

import { useState, useRef } from "react";
import { getIdToken } from "firebase/auth";

const STYLES = [
  { value: "modern",         label: "Modern",         icon: "✨" },
  { value: "photorealistic", label: "Photorealistic", icon: "📷" },
  { value: "minimalist",     label: "Minimalist",     icon: "⬜" },
  { value: "vibrant",        label: "Vibrant",        icon: "🌈" },
  { value: "luxury",         label: "Luxury",         icon: "💎" },
  { value: "anime",          label: "Illustrated",    icon: "🎨" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram Post",  icon: "📸", size: "1:1"  },
  { value: "story",     label: "Story / Reels",   icon: "📱", size: "9:16" },
  { value: "facebook",  label: "Facebook Cover",  icon: "👍", size: "16:9" },
  { value: "twitter",   label: "Twitter / X",     icon: "🐦", size: "16:9" },
];

const COLORS = [
  { value: "vibrant",    label: "Vibrant",   color: "from-pink-500 to-orange-500"  },
  { value: "blue",       label: "Blue",      color: "from-blue-500 to-cyan-500"    },
  { value: "green",      label: "Green",     color: "from-green-500 to-teal-500"   },
  { value: "purple",     label: "Purple",    color: "from-purple-500 to-pink-500"  },
  { value: "gold",       label: "Gold",      color: "from-yellow-500 to-amber-500" },
  { value: "monochrome", label: "Mono",      color: "from-gray-400 to-gray-600"    },
];

const MOODS = ["energetic", "calm", "luxurious", "fun", "serious"];

interface Props {
  firebaseUser: any;
  onSaved?: () => void;
}

// Draw text with wrapping on canvas
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2;
  for (const l of lines) {
    ctx.fillText(l, x, startY);
    startY += lineHeight;
  }
}

export default function AIImageGenerator({ firebaseUser, onSaved }: Props) {
  const [description,  setDescription]  = useState("");
  const [style,        setStyle]        = useState("modern");
  const [platform,     setPlatform]     = useState("instagram");
  const [colorTheme,   setColorTheme]   = useState("vibrant");
  const [mood,         setMood]         = useState("energetic");
  const [overlayText,  setOverlayText]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imagePrompt,  setImagePrompt]  = useState("");
  const [error,        setError]        = useState("");

  const handleGenerate = async () => {
    if (!description.trim() || !firebaseUser) return;
    setLoading(true);
    setError("");
    setImageDataUrl("");
    setImagePrompt("");

    try {
      const token = await getIdToken(firebaseUser);
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/design/generate-image`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description, style, platform, colorTheme, mood }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Image generation failed. Please try again.");
        return;
      }
      setImageDataUrl(data.imageDataUrl);
      setImagePrompt(data.imagePrompt || "");
      // Auto-set overlay text from first line of description
      if (!overlayText) setOverlayText(description.split(".")[0].slice(0, 60));
      onSaved?.();
    } catch {
      setError("Failed to connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Composite image + text overlay using Canvas, then download
  const handleDownload = async () => {
    if (!imageDataUrl) return;

    if (!overlayText.trim()) {
      // No overlay — download raw image directly
      const a    = document.createElement("a");
      a.href     = imageDataUrl;
      a.download = `ai-post-${Date.now()}.jpg`;
      a.click();
      return;
    }

    // Determine canvas dimensions based on platform
    const isVertical  = platform === "story";
    const isLandscape = platform === "facebook" || platform === "twitter";
    const w = isVertical ? 576 : isLandscape ? 1024 : 1024;
    const h = isVertical ? 1024 : isLandscape ? 576  : 1024;

    const canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Draw the base image
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i  = new Image();
      i.onload  = () => res(i);
      i.onerror = rej;
      i.src     = imageDataUrl;
    });
    ctx.drawImage(img, 0, 0, w, h);

    // Semi-transparent overlay bar at bottom
    const barH = h * 0.22;
    const grad = ctx.createLinearGradient(0, h - barH, 0, h);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - barH, w, barH);

    // Text
    const fontSize = Math.round(w * 0.06);
    ctx.font        = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle   = "white";
    ctx.textAlign   = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur  = 12;
    drawWrappedText(ctx, overlayText, w / 2, h - barH / 2, w * 0.85, fontSize * 1.3);

    // Download composited image
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `ai-post-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  };

  const handleReset = () => {
    setImageDataUrl("");
    setImagePrompt("");
    setDescription("");
    setOverlayText("");
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border border-violet-500/25 rounded-2xl px-5 py-4 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">🤖</span>
        <div>
          <div className="text-sm font-bold mb-1">AI Image Generator</div>
          <div className="text-xs text-gray-400">
            Describe your post → <span className="text-violet-400 font-semibold">Gemini AI</span> crafts the perfect prompt → <span className="text-violet-400 font-semibold">Pollinations AI</span> generates your image → Add text → Download!
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <div className="space-y-5">

          {/* Description */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <label className="text-sm font-bold text-gray-200 block">
              What is your post about? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Happy New Year 2027 celebration post, fireworks, vibrant colors, Sri Lankan style..."
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-gray-400">Mood:</label>
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setMood(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${
                    mood === m
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30"
                  }`}>{m}</button>
              ))}
            </div>
          </div>

          {/* Text Overlay */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <label className="text-sm font-bold text-gray-200 block">
              📝 Text to show on image <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={overlayText}
              onChange={e => setOverlayText(e.target.value)}
              placeholder="e.g. Happy New Year 2027 🎉"
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all"
            />
            <p className="text-xs text-gray-500">This text will be composited onto the image when you download it.</p>
          </div>

          {/* Platform */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-sm font-bold text-gray-200 mb-3 block">Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    platform === p.value
                      ? "bg-violet-600/20 border-violet-500/50 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30"
                  }`}>
                  <span>{p.icon}</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.size}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-sm font-bold text-gray-200 mb-3 block">Visual Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button key={s.value} type="button" onClick={() => setStyle(s.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    style === s.value
                      ? "bg-violet-600/20 border-violet-500/50 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30"
                  }`}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-sm font-bold text-gray-200 mb-3 block">Color Theme</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColorTheme(c.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    colorTheme === c.value
                      ? "border-white/40 ring-2 ring-white/20"
                      : "border-white/10 hover:border-white/20"
                  }`}>
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${c.color}`} />
                  <span className="text-xs text-gray-300">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button type="button" onClick={handleGenerate}
            disabled={loading || !description.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-violet-900/30 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating Image...
              </>
            ) : "🎨 Generate AI Image"}
          </button>
        </div>

        {/* Right — Output */}
        <div className="space-y-4">
          {!imageDataUrl && !loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center min-h-[500px]">
              <div className="text-center text-gray-500 px-8">
                <div className="text-5xl mb-4">🎨</div>
                <div className="text-sm font-semibold text-gray-400 mb-2">Your AI image will appear here</div>
                <div className="text-xs">Describe your post and click Generate</div>
                <div className="mt-4 text-xs text-gray-600">Gemini AI + Pollinations AI • Free • ~15 seconds</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center min-h-[500px]">
              <div className="text-center px-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-4xl mx-auto mb-4 animate-pulse">
                  🤖
                </div>
                <div className="text-sm font-semibold mb-2">AI is creating your image...</div>
                <div className="text-xs text-gray-400 mb-4">Crafting perfect prompt & generating high-quality image...</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-48 mx-auto">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "70%" }} />
                </div>
                <div className="text-xs text-gray-600 mt-3">This may take 10–20 seconds</div>
              </div>
            </div>
          )}

          {imageDataUrl && (
            <div className="space-y-4">
              {/* Image preview with overlay text */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 overflow-hidden">
                <div className={`relative overflow-hidden rounded-xl ${
                  platform === "story"
                    ? "aspect-[9/16]"
                    : platform === "facebook" || platform === "twitter"
                    ? "aspect-video"
                    : "aspect-square"
                }`}>
                  <img
                    src={imageDataUrl}
                    alt="AI Generated Post"
                    className="w-full h-full object-cover"
                  />
                  {/* Text overlay preview */}
                  {overlayText && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-5 flex items-end">
                      <p className="text-white font-bold text-center w-full text-sm leading-snug drop-shadow-lg">
                        {overlayText}
                      </p>
                    </div>
                  )}
                </div>
                {overlayText && (
                  <p className="text-xs text-gray-500 text-center mt-2">Preview — text will be embedded when you download</p>
                )}
              </div>

              {/* Prompt used */}
              {imagePrompt && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-400 mb-2">✨ AI Prompt Used:</div>
                  <div className="text-xs text-gray-500 leading-relaxed line-clamp-3">{imagePrompt}</div>
                </div>
              )}

              {/* Text overlay input (also visible here for quick edit) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-semibold text-gray-300">📝 Edit text on image:</label>
                <input
                  type="text"
                  value={overlayText}
                  onChange={e => setOverlayText(e.target.value)}
                  placeholder="Text to embed on image (optional)"
                  maxLength={80}
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                  ⬇️ Download {overlayText ? "with Text" : "Image"}
                </button>
                <button type="button" onClick={handleGenerate} disabled={loading}
                  className="bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  🔄 Regenerate
                </button>
              </div>
              <button type="button" onClick={handleReset}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-sm text-gray-400 transition-all">
                + Create New Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
