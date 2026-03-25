interface Props {
  urlInput: string;
  setUrlInput: (val: string) => void;
  analyzing: boolean;
  onAnalyze: () => void;
}

export default function URLAnalyzer({ urlInput, setUrlInput, analyzing, onAnalyze }: Props) {
  return (
    <div className="bg-gradient-to-r from-green-600/15 to-emerald-600/15 border border-green-500/25 rounded-2xl p-5">
      <div className="text-sm font-bold mb-3">🔍 Analyze Your Website</div>
      <div className="flex gap-3">
        <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
          placeholder="https://yourwebsite.lk"
          className="flex-1 bg-white/5 border border-white/10 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        <button type="button" onClick={onAnalyze} disabled={analyzing}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 flex-shrink-0">
          {analyzing ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>Analyzing...</>
          ) : "Analyze SEO"}
        </button>
      </div>
    </div>
  );
}