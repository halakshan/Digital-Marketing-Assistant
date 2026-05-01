// ─── Types ───────────────────────────────────────────────────────────────────
export interface Project {
  id: number;
  icon: string;
  title: string;
  client: string;
  due: string;
  budget: string;
  status: "progress" | "review" | "done";
}

export interface Message {
  id: number;
  name: string;
  preview: string;
  time: string;
  gradient: string;
  unread: boolean;
}

export interface Job {
  id: number;
  icon: string;
  title: string;
  meta: string;
  budget: string;
}

export interface Review {
  id: number;
  name: string;
  stars: number;
  text: string;
}

export interface Toast {
  id: number;
  type: "green" | "yellow" | "purple";
  icon: string;
  title: string;
  sub: string;
  action: string;
}

export interface EarningsBar {
  month: string;
  pct: number;
}

// ─── Colour Tokens (matches your existing theme exactly) ─────────────────────
export const C = {
  bg:         "#0d0f1a",
  surface:    "#13162a",
  card:       "#181c30",
  border:     "#252a45",
  purple:     "#7c3aed",
  accent:     "#a78bfa",
  purpleGlow: "rgba(124,58,237,0.18)",
  green:      "#22c55e",
  yellow:     "#eab308",
  blue:       "#3b82f6",
  text:       "#e2e8f0",
  muted:      "#64748b",
  subtle:     "#94a3b8",
};

// ─── Static Data ─────────────────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  { id: 1, icon: "🎨", title: "Social Media Kit – Ceylonara Foods", client: "Amal Perera", due: "Mar 18", budget: "LKR 45,000", status: "progress" },
  { id: 2, icon: "🎬", title: "Video Ad – Sathosa Promotion",        client: "Nimal Silva",  due: "Mar 22", budget: "LKR 60,000", status: "review"   },
];

export const MESSAGES: Message[] = [
  { id: 1, name: "Amal Perera",  preview: "Can you update the logo color to green?", time: "2m ago", gradient: "linear-gradient(135deg,#7c3aed,#3b82f6)", unread: true  },
  { id: 2, name: "Nimal Silva",  preview: "Can we schedule a call tomorrow?",         time: "1h ago", gradient: "linear-gradient(135deg,#059669,#0284c7)", unread: true  },
  { id: 3, name: "Sumudu Lanka", preview: "Great work on the Instagram posts! ⭐",    time: "3h ago", gradient: "linear-gradient(135deg,#d97706,#dc2626)", unread: false },
];

export const JOB_MATCHES: Job[] = [
  { id: 1, icon: "📱", title: "Instagram Designer Needed",   meta: "Sinhala Content • Fixed Price", budget: "LKR 30,000" },
  { id: 2, icon: "🎬", title: "Short Video Ad – Food Brand", meta: "30 sec reel • Urgent",          budget: "LKR 25,000" },
  { id: 3, icon: "🏷️", title: "Logo + Brand Kit Design",    meta: "Full brand identity",            budget: "LKR 50,000" },
];

export const REVIEWS: Review[] = [
  { id: 1, name: "Amal Perera",  stars: 5, text: "Outstanding work! Delivered ahead of schedule and nailed our brand vision perfectly." },
  { id: 2, name: "Sumudu Lanka", stars: 5, text: "Kasun understood the Sinhala content requirement perfectly. Highly recommend!"        },
];

export const EARNINGS_BARS: EarningsBar[] = [
  { month: "Oct", pct: 58 }, { month: "Nov", pct: 45 },
  { month: "Dec", pct: 83 }, { month: "Jan", pct: 54 },
  { month: "Feb", pct: 71 }, { month: "Mar", pct: 96 },
];

export const INITIAL_TOASTS: Toast[] = [];