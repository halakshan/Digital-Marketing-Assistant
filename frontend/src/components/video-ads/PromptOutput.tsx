type Step = "form" | "prompt" | "generating" | "done";

interface Props {
  step: Step;
  prompt: string;
  copied: boolean;
  adStyle: string;
  platform: string;
  language: string;
  duration: string;
  mood: string;
  veoLive: boolean;
  hasVideo: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onSendToVeo: () => void;
  onDownloadScript: () => void;
  onDownloadVideo: () => void;
  onReset: () => void;
}

export default function PromptOutput({
  step, prompt, copied, adStyle, platform, language, duration, mood,
  veoLive, hasVideo,
  onCopy, onRegenerate, onSendToVeo, onDownloadScript, onDownloadVideo, onReset,
}: Props) {
  return (
    <div className="space-y-4">

      {/* Config Tags */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-200">Ad Configuration</h3>
          <button type="button" onClick={onReset}
            className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Start over
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[adStyle, platform.replace(/_/g, " "), language, duration, mood].map((tag, i) => (
            <span key={i} className="text-xs bg-white/10 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg capitalize">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Prompt Box */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-200">✅ Veo 3 Script Generated</h3>
          <div className="flex gap-2">
            <button type="button" onClick={onCopy}
              className="text-xs bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 text-pink-300 px-3 py-1.5 rounded-lg transition-all">
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button type="button" onClick={onRegenerate}
              className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition-all">
              🔄 Regenerate
            </button>
            <button type="button" onClick={onDownloadScript}
              className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition-all">
              📄 Download Script
            </button>
          </div>
        </div>
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono max-h-72 overflow-y-auto">
          {prompt}
        </div>
      </div>

      {/* Send to Veo — only shown on "prompt" step */}
      {step === "prompt" && (
        <button type="button" onClick={onSendToVeo}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-pink-900/30 flex items-center justify-center gap-2">
          🚀 Send to Veo 3 &amp; Generate Video
        </button>
      )}

      {/* Generating */}
      {step === "generating" && (
        <div className="bg-gradient-to-r from-pink-600/15 to-rose-600/15 border border-pink-500/30 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">🎬</div>
          <div className="text-base font-bold mb-2">Veo 3 is generating your video...</div>
          <div className="text-xs text-gray-400 mb-4">This usually takes 2–5 minutes. We'll update automatically.</div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            While you wait — you can also paste the script into{" "}
            <a href="https://aistudio.google.com/generate-video" target="_blank" rel="noreferrer"
              className="text-pink-400 hover:text-pink-300 underline">
              Google AI Studio ↗
            </a>
          </p>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="bg-gradient-to-r from-green-600/15 to-emerald-600/15 border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <div className="text-base font-bold text-green-400 mb-1">
            {hasVideo ? "Video Ad Ready!" : "Script Ready!"}
          </div>
          <div className="text-xs text-gray-400 mb-5">
            {hasVideo
              ? `Your ${duration} ${language} video ad has been generated successfully.`
              : `Your Veo 3 script is saved. Download it and use it in Google AI Studio or Veo 3 to generate the video.`}
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button type="button" onClick={onDownloadVideo}
              className="bg-green-600 hover:bg-green-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5">
              ⬇️ {hasVideo ? "Download Video" : "Download Script"}
            </button>
            {!hasVideo && (
              <a href="https://aistudio.google.com/generate-video" target="_blank" rel="noreferrer"
                className="bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5">
                🎬 Open Veo 3 ↗
              </a>
            )}
            <button type="button" onClick={onReset}
              className="bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              + New Ad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
