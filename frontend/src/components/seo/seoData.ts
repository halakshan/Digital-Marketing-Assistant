export const SEO_ISSUES = [
  { type: "error",   title: "Missing Meta Description", desc: "3 pages are missing meta descriptions. This hurts your click-through rate.",    fix: "Add meta descriptions" },
  { type: "error",   title: "Broken Internal Links",    desc: "2 broken links found on your website. Search engines cannot crawl these pages.", fix: "Fix broken links"      },
  { type: "warning", title: "Slow Page Speed",          desc: "Your homepage loads in 4.2s. Google recommends under 3s for mobile users.",      fix: "Optimize images"       },
  { type: "warning", title: "Images Missing Alt Text",  desc: "12 images are missing alt text. This affects accessibility and image SEO.",       fix: "Add alt text"          },
  { type: "warning", title: "Duplicate Title Tags",     desc: "2 pages share the same title tag. Each page should have a unique title.",         fix: "Update titles"         },
  { type: "info",    title: "No SSL Certificate",       desc: "Your site uses HTTP instead of HTTPS. Google penalizes non-secure sites.",        fix: "Enable SSL"            },
  { type: "info",    title: "Missing XML Sitemap",      desc: "No sitemap found. A sitemap helps Google discover all your pages faster.",        fix: "Generate sitemap"      },
];

export const KEYWORDS = [
  { keyword: "sri lanka boutique",          volume: 2400, difficulty: 42, rank: 8,  change: "+3" },
  { keyword: "colombo fashion store",       volume: 1800, difficulty: 38, rank: 12, change: "+5" },
  { keyword: "batik clothing sri lanka",    volume: 3200, difficulty: 55, rank: 5,  change: "+1" },
  { keyword: "online shopping colombo",     volume: 8900, difficulty: 78, rank: 24, change: "-2" },
  { keyword: "handmade clothing lk",        volume: 890,  difficulty: 28, rank: 3,  change: "+8" },
  { keyword: "fashion boutique kandy",      volume: 1200, difficulty: 35, rank: 15, change: "0"  },
  { keyword: "sinhala fashion blog",        volume: 640,  difficulty: 22, rank: 7,  change: "+4" },
  { keyword: "sri lanka summer collection", volume: 1560, difficulty: 48, rank: 18, change: "-1" },
];

export const PAGES = [
  { url: "/",         title: "Home",      score: 82, issues: 2, traffic: 1240 },
  { url: "/products", title: "Products",  score: 71, issues: 4, traffic: 890  },
  { url: "/about",    title: "About Us",  score: 90, issues: 1, traffic: 320  },
  { url: "/contact",  title: "Contact",   score: 68, issues: 3, traffic: 210  },
  { url: "/blog",     title: "Blog",      score: 75, issues: 3, traffic: 560  },
  { url: "/sale",     title: "Sale",      score: 58, issues: 6, traffic: 430  },
];

export const STATS = [
  { label: "SEO Score",       value: "76",    icon: "📈", color: "text-green-400",  bg: "from-green-500/20 to-green-600/5",    border: "border-green-500/30",  change: "+4 pts"   },
  { label: "Total Issues",    value: "7",     icon: "⚠️",  color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/5",  border: "border-yellow-500/30", change: "-3 fixed" },
  { label: "Keywords Ranked", value: "8",     icon: "🔑",  color: "text-blue-400",   bg: "from-blue-500/20 to-blue-600/5",     border: "border-blue-500/30",   change: "+2 new"   },
  { label: "Organic Traffic", value: "3,650", icon: "👥",  color: "text-violet-400", bg: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/30", change: "+12%"     },
];

export function issueStyle(type: string) {
  if (type === "error")   return { badge: "bg-red-500/15 text-red-400 border-red-500/30",         icon: "🔴", bar: "bg-red-500"    };
  if (type === "warning") return { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: "🟡", bar: "bg-yellow-500" };
  return                         { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",      icon: "🔵", bar: "bg-blue-500"   };
}