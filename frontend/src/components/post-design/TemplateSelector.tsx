import { TEMPLATES, CATEGORIES } from "./postDesignData";

// Direct Canva template search URLs per template
const CANVA_LINKS: Record<string, string> = {
  "Summer Sale":       "https://www.canva.com/templates/?query=summer+sale+instagram+post",
  "Product Launch":    "https://www.canva.com/templates/?query=product+launch+social+media",
  "Flash Sale":        "https://www.canva.com/templates/?query=flash+sale+instagram",
  "Food & Restaurant": "https://www.canva.com/templates/?query=food+restaurant+instagram+post",
  "Fashion Post":      "https://www.canva.com/templates/?query=fashion+instagram+post",
  "Real Estate":       "https://www.canva.com/templates/?query=real+estate+social+media",
  "Festival Special":  "https://www.canva.com/templates/?query=festival+celebration+post",
  "Health & Wellness": "https://www.canva.com/templates/?query=health+wellness+instagram",
  "Tech & Gadgets":    "https://www.canva.com/templates/?query=tech+gadget+product+post",
  "Beauty & Skincare": "https://www.canva.com/templates/?query=beauty+skincare+instagram",
  "Event Promotion":   "https://www.canva.com/templates/?query=event+promotion+social+media",
  "Quote / Motivation":"https://www.canva.com/templates/?query=motivational+quote+instagram",
};

interface Props {
  activeCategory: string;
  setActiveCategory: (val: string) => void;
  onSelectTemplate: (id: number) => void;
  onOpenCanva: () => void;
}

export default function TemplateSelector({ activeCategory, setActiveCategory, onSelectTemplate, onOpenCanva }: Props) {
  const filtered = activeCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-5">

      {/* Canva Banner */}
      <div className="bg-white/5 border border-white/15 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <div className="text-sm font-bold text-white">Canva Templates</div>
              <div className="text-xs text-gray-400">
                Click <span className="text-white font-semibold">"Open in Canva"</span> on any template to edit it in Canva's full editor, or <span className="text-white font-semibold">"Customize"</span> to edit here.
              </div>
            </div>
          </div>
          <button type="button" onClick={onOpenCanva}
            className="flex-shrink-0 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
            Browse All on Canva ↗
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === cat
                ? "bg-white text-black border-white"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
            }`}>{cat}</button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id}
            className={`bg-gradient-to-br ${t.bg} border ${t.border} rounded-2xl p-4 flex flex-col items-center gap-2 group relative overflow-hidden`}>

            {/* Template preview */}
            <div className="text-4xl mb-1">{t.emoji}</div>
            <div className="text-sm font-bold text-white text-center">{t.name}</div>
            <div className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full mb-1">{t.category}</div>

            {/* Action buttons — always visible */}
            <div className="w-full flex flex-col gap-1.5 mt-1">
              <a
                href={CANVA_LINKS[t.name] || "https://www.canva.com/templates"}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-full bg-white hover:bg-gray-200 text-black text-xs font-bold py-2 rounded-xl transition-all text-center">
                🎨 Open in Canva ↗
              </a>
              <button
                type="button"
                onClick={() => onSelectTemplate(t.id)}
                className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 rounded-xl transition-all">
                ✏️ Customize Here
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-600">
        💡 "Open in Canva" → full Canva editor &nbsp;|&nbsp; "Customize Here" → quick in-app editor
      </div>
    </div>
  );
}
