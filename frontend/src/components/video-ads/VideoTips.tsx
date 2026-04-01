const TIPS = [
  { icon: "🎯", tip: "Be specific about your product — include color, texture, and unique features."  },
  { icon: "👥", tip: "Define your audience clearly — age, location, and interests improve relevance." },
  { icon: "🌍", tip: "Sinhala & Tamil voiceovers increase engagement with local audiences by 3x."     },
  { icon: "⏱️", tip: "15-30 second ads perform best on Instagram Reels and TikTok."                  },
  { icon: "🎵", tip: "The Cinematic style works best for premium and luxury products."                },
];

export default function VideoTips() {
  return (
    <div className="bg-gradient-to-br from-pink-600/10 to-rose-600/10 border border-pink-500/20 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-200 mb-4">💡 Tips for Better Video Ads</h3>
      <div className="space-y-3">
        {TIPS.map((t, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-base flex-shrink-0">{t.icon}</span>
            <p className="text-xs text-gray-400 leading-relaxed">{t.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}