interface Props {
  topic: string;
  setTopic: (val: string) => void;
  keywords: string;
  setKeywords: (val: string) => void;
  loading: boolean;
  onGenerate: () => void;
}

export default function ContentForm({ topic, setTopic, keywords, setKeywords, loading, onGenerate }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-200 mb-2 block">
            What is your post about? <span className="text-red-400">*</span>
          </label>
          <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={3}
            placeholder="e.g. Summer sale with 50% off on all clothing items at my Colombo boutique"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">
            Keywords <span className="text-gray-600">(optional)</span>
          </label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="e.g. fashion, sale, Colombo, affordable"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
      </div>

      <button type="button" onClick={onGenerate} disabled={loading || !topic.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-violet-900/30">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Generating with AI...
          </span>
        ) : "✨ Generate Content"}
      </button>
    </div>
  );
}