// Template definitions for Canva-linked post design templates
export const TEMPLATES = [
  { id: 1,  name: "Summer Sale",        category: "Sale",     emoji: "🌅", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 2,  name: "Product Launch",     category: "Product",  emoji: "🚀", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 3,  name: "Flash Sale",         category: "Sale",     emoji: "⚡", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 4,  name: "Food & Restaurant",  category: "Food",     emoji: "🍜", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 5,  name: "Fashion Post",       category: "Fashion",  emoji: "👗", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 6,  name: "Real Estate",        category: "Property", emoji: "🏠", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 7,  name: "Festival Special",   category: "Festival", emoji: "🎉", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 8,  name: "Health & Wellness",  category: "Health",   emoji: "💪", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 9,  name: "Tech & Gadgets",     category: "Tech",     emoji: "💻", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 10, name: "Beauty & Skincare",  category: "Beauty",   emoji: "✨", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 11, name: "Event Promotion",    category: "Event",    emoji: "🎤", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
  { id: 12, name: "Quote / Motivation", category: "Quote",    emoji: "💬", bg: "from-violet-500/30 to-indigo-500/30", border: "border-violet-500/30" },
];

export const CATEGORIES = ["All", "Sale", "Product", "Food", "Fashion", "Festival", "Health", "Tech", "Beauty", "Event", "Quote", "Property"];

export const SIZES = [
  { label: "Square",    size: "1080×1080", icon: "⬛", ratio: "1:1"  },
  { label: "Portrait",  size: "1080×1350", icon: "📱", ratio: "4:5"  },
  { label: "Story",     size: "1080×1920", icon: "📲", ratio: "9:16" },
  { label: "Landscape", size: "1200×628",  icon: "🖥️", ratio: "16:9" },
];

export type Template = typeof TEMPLATES[0];
