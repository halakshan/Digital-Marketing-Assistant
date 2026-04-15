import { PLATFORMS, DURATIONS, LANGUAGES, MOODS } from "./videoAdsData";

interface Props {
  platform: string;  setPlatform: (v: string) => void;
  duration: string;  setDuration: (v: string) => void;
  language: string;  setLanguage: (v: string) => void;
  mood: string;      setMood: (v: string) => void;
}

export default function AdOptions({ platform, setPlatform, duration, setDuration, language, setLanguage, mood, setMood }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">

      {/* Platform */}
      <div>
        <label className="text-sm font-bold text-gray-200 mb-3 block">Target Platform</label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map(p => (
            <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                platform === p.value
                  ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                  : "bg-white/5 border-white/10 hover:border-indigo-500/30 text-gray-400"
              }`}>
              <span className="text-lg">{p.icon}</span>
              <div className="text-left">
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="text-xs text-gray-500">{p.ratio}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block font-semibold">Duration</label>
        <div className="flex gap-2 flex-wrap">
          {DURATIONS.map(d => (
            <button key={d} type="button" onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                duration === d
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/40"
              }`}>{d}</button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block font-semibold">Voiceover Language</label>
        <div className="flex gap-2">
          {LANGUAGES.map(l => (
            <button key={l} type="button" onClick={() => setLanguage(l)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                language === l
                  ? "bg-pink-600 border-pink-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-pink-500/40"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block font-semibold">Ad Mood</label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button key={m} type="button" onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                mood === m
                  ? "bg-green-600 border-green-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-green-500/40"
              }`}>{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}