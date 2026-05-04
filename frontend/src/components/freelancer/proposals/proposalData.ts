export interface Proposal {
  id:     number;
  icon:   string;
  title:  string;
  client: string;
  budget: string;
  sent:   string;
  status: string;
  bid:    string;
}

export const PROPOSALS: Proposal[] = [
  { id: 1, icon: "📱", title: "Instagram Content Designer",  client: "Amara Foods",     budget: "LKR 30,000", sent: "Mar 10", status: "pending",  bid: "LKR 28,000" },
  { id: 2, icon: "🎬", title: "YouTube Intro Animation",     client: "TechZone LK",     budget: "LKR 40,000", sent: "Mar 8",  status: "accepted", bid: "LKR 38,000" },
  { id: 3, icon: "🏷️", title: "Logo Redesign – Café Brand", client: "Kopi House",      budget: "LKR 25,000", sent: "Mar 5",  status: "rejected", bid: "LKR 22,000" },
  { id: 4, icon: "🌐", title: "Shopify Landing Page Design", client: "Malshi Boutique", budget: "LKR 55,000", sent: "Mar 3",  status: "pending",  bid: "LKR 50,000" },
  { id: 5, icon: "📧", title: "Email Newsletter Template",   client: "Ceylon Organics", budget: "LKR 18,000", sent: "Feb 28", status: "accepted", bid: "LKR 17,000" },
];

export const STATUS_MAP = {
  pending:  { bg: "rgba(234,179,8,0.12)",  color: "#eab308", border: "rgba(234,179,8,0.3)",  label: "⏳ Pending"  },
  accepted: { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.3)",  label: "✅ Accepted" },
  rejected: { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", border: "rgba(239,68,68,0.3)",  label: "❌ Rejected" },
};

export const FILTERS = ["all", "pending", "accepted", "rejected"];