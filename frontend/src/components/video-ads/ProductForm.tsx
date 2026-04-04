interface Props {
  product: string;   setProduct: (v: string) => void;
  audience: string;  setAudience: (v: string) => void;
  keyMsg: string;    setKeyMsg: (v: string) => void;
  loading: boolean;
  onGenerate: () => void;
}

export default function ProductForm({ product, setProduct, audience, setAudience, keyMsg, setKeyMsg, loading, onGenerate }: Props) {
  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-bold text-gray-200 mb-2 block">Product / Service <span className="text-red-400">*</span></label>
          <input value={product} onChange={e => setProduct(e.target.value)}
            placeholder="e.g. Handmade Batik Clothing Collection from Colombo"
            className="w-full bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-200 mb-2 block">Target Audience <span className="text-red-400">*</span></label>
          <input value={audience} onChange={e => setAudience(e.target.value)}
            placeholder="e.g. Women aged 25-40, fashion-conscious, Sri Lanka"
            className="w-full bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-200 mb-2 block">Key Message <span className="text-gray-600 text-xs font-normal">(optional)</span></label>
          <textarea value={keyMsg} onChange={e => setKeyMsg(e.target.value)} rows={2}
            placeholder="e.g. Limited summer collection — 30% off this week only"
            className="w-full bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none" />
        </div>
      </div>

      <button type="button" onClick={onGenerate} disabled={loading || !product.trim() || !audience.trim()}
        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-pink-900/30 flex items-center justify-center gap-2">
        {loading ? (
          <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>Generating Veo 3 Prompt...</>
        ) : "🎬 Generate Video Ad Prompt"}
      </button>
    </>
  );
}