const CATEGORIES = [
  { key: "all",          label: "All",             icon: "👥" },
  { key: "designer",     label: "Designers",       icon: "🎨" },
  { key: "video",        label: "Video Editors",   icon: "🎬" },
  { key: "developer",    label: "Developers",      icon: "💻" },
  { key: "photographer", label: "Photographers",   icon: "📸" },
  { key: "influencer",   label: "Influencers",     icon: "📣" },
  { key: "writer",       label: "Content Writers", icon: "✍️" },
];

interface Props {
  activeCategory: string;
  setActiveCategory: (val: string) => void;
}

export default function FreelancerCategories({ activeCategory, setActiveCategory }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(cat => (
        <button key={cat.key} type="button" onClick={() => setActiveCategory(cat.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === cat.key
              ? "bg-fuchsia-600/20 border-fuchsia-500/40 text-fuchsia-300"
              : "bg-white/5 border-white/10 text-gray-400 hover:border-fuchsia-500/30 hover:text-white"
          }`}>
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}