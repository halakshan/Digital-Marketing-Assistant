import { SIZES, Template } from "./postDesignData";

interface Props {
  template: Template;
  selectedSize: string;
  setSelectedSize: (val: string) => void;
  headline: string;
  setHeadline: (val: string) => void;
  subtext: string;
  setSubtext: (val: string) => void;
  ctaText: string;
  setCtaText: (val: string) => void;
  brandName: string;
  setBrandName: (val: string) => void;
  onBack: () => void;
  onPreview: () => void;
}

export default function CustomizeForm({
  template, selectedSize, setSelectedSize,
  headline, setHeadline, subtext, setSubtext,
  ctaText, setCtaText, brandName, setBrandName,
  onBack, onPreview,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Selected Template */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.bg} border ${template.border} flex items-center justify-center text-3xl flex-shrink-0`}>
          {template.emoji}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">{template.name}</div>
          <div className="text-xs text-gray-400">{template.category} template</div>
        </div>
        <button type="button" onClick={onBack} className="text-xs text-gray-500 hover:text-white transition-colors">Change →</button>
      </div>

      {/* Post Size */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <label className="text-sm font-bold text-gray-200 mb-3 block">Post Size</label>
        <div className="grid grid-cols-2 gap-2">
          {SIZES.map(s => (
            <button key={s.label} type="button" onClick={() => setSelectedSize(s.label)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedSize === s.label
                  ? "bg-white/15 border-white/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
              }`}>
              <span className="text-xl">{s.icon}</span>
              <div className="text-left">
                <div className="text-xs font-semibold">{s.label}</div>
                <div className="text-xs text-gray-500">{s.size} · {s.ratio}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Post Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <label className="text-sm font-bold text-gray-200 block">Post Content</label>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Headline <span className="text-red-400">*</span></label>
          <input value={headline} onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. SUMMER SALE — 50% OFF"
            className="w-full bg-white/5 border border-white/10 focus:border-white/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Subtext</label>
          <input value={subtext} onChange={e => setSubtext(e.target.value)}
            placeholder="e.g. Shop our latest collection today"
            className="w-full bg-white/5 border border-white/10 focus:border-white/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Call to Action Button</label>
          <input value={ctaText} onChange={e => setCtaText(e.target.value)}
            placeholder="e.g. Shop Now, Learn More, Book Today"
            className="w-full bg-white/5 border border-white/10 focus:border-white/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Brand / Business Name</label>
          <input value={brandName} onChange={e => setBrandName(e.target.value)}
            placeholder="e.g. Kasun's Boutique"
            className="w-full bg-white/5 border border-white/10 focus:border-white/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 rounded-2xl font-semibold text-sm transition-all">
          ← Back
        </button>
        <button type="button" onClick={onPreview} disabled={!headline.trim()}
          className="flex-1 bg-white hover:bg-gray-200 text-black disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-2xl font-bold text-sm transition-all">
          Preview Design →
        </button>
      </div>
    </div>
  );
}