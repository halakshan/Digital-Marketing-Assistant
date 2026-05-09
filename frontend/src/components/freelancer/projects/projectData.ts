export interface Project {
  id:         number;
  icon:       string;
  title:      string;
  client:     string;
  budget:     string;
  paid:       string;
  due:        string;
  progress:   number;
  status:     string;
  milestones: string[];
}

export const PROJECTS: Project[] = [
  {
    id: 1, icon: "🎨",
    title:      "Social Media Kit – Ceylonara Foods",
    client:     "Amal Perera",
    budget:     "LKR 45,000",
    paid:       "LKR 22,500",
    due:        "Mar 18, 2026",
    progress:   65,
    status:     "progress",
    milestones: ["Brief & Research ✅", "Initial Designs ✅", "Client Review 🔄", "Final Delivery ⏳"],
  },
  {
    id: 2, icon: "🎬",
    title:      "Video Ad – Sathosa Promotion",
    client:     "Nimal Silva",
    budget:     "LKR 60,000",
    paid:       "LKR 30,000",
    due:        "Mar 22, 2026",
    progress:   80,
    status:     "review",
    milestones: ["Script & Storyboard ✅", "Raw Footage ✅", "Editing ✅", "Client Approval 🔄"],
  },
];

export const STATUS_MAP = {
  progress: { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", border: "rgba(59,130,246,0.3)",  label: "In Progress" },
  review:   { bg: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.3)",   label: "In Review"   },
  done:     { bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "rgba(34,197,94,0.3)",   label: "Completed"   },
};

export const SUMMARY_STATS = [
  { label: "Active Projects", val: "2",         colorKey: "accent" },
  { label: "Total Value",     val: "LKR 105k",  colorKey: "green"  },
  { label: "Earned So Far",   val: "LKR 52.5k", colorKey: "yellow" },
];