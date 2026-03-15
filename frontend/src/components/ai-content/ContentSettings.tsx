const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter"];
const TONES     = ["Professional", "Casual", "Funny", "Inspirational", "Urgent"];
const LANGUAGES = ["English", "Sinhala", "Tamil"];

interface Props {
  platform: string;
  setPlatform: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  tone: string;
  setTone: (val: string) => void;
}

export default function ContentSettings({ platform, setPlatform, language, setLanguage, tone, setTone }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <label className="block text-sm font-semibold text-gray-200">Settings</label>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p} type="button" onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platform === p
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-indigo-500/40"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">Language</label>
        <div className="flex gap-2">
          {LANGUAGES.map(l => (
            <button key={l} type="button" onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === l
                  ? "bg-pink-600 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-pink-500/40"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map(t => (
            <button key={t} type="button" onClick={() => setTone(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tone === t
                  ? "bg-green-600 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-green-500/40"
              }`}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}