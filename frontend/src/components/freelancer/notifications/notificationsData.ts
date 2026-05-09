import { C } from "@/components/freelancer/dashboard/dashboardData";

export interface Notif {
  id:   number;
  type: string;
  icon: string;
  title: string;
  desc:  string;
  time:  string;
  read:  boolean;
}

export const NOTIFS: Notif[] = [
  { id: 1, type: "payment",  icon: "✅", title: "Payment Received",     desc: "LKR 45,000 received from Amal Perera for Social Media Kit",      time: "2 min ago",   read: false },
  { id: 2, type: "job",      icon: "📋", title: "New Job Match",         desc: "Instagram Designer needed • LKR 30,000 • Sinhala Content",        time: "1 hour ago",  read: false },
  { id: 3, type: "message",  icon: "💬", title: "New Message",           desc: "Nimal Silva: Can we schedule a call tomorrow?",                   time: "2 hours ago", read: false },
  { id: 4, type: "proposal", icon: "📨", title: "Proposal Accepted",     desc: "Your proposal for YouTube Intro Animation was accepted!",         time: "5 hours ago", read: true  },
  { id: 5, type: "review",   icon: "⭐", title: "New Review",            desc: "Sumudu Lanka left you a 5-star review on Instagram Posts project",time: "1 day ago",   read: true  },
  { id: 6, type: "payment",  icon: "⏳", title: "Payment Pending",       desc: "LKR 18,000 payout is being processed to your account",           time: "1 day ago",   read: true  },
  { id: 7, type: "system",   icon: "🚀", title: "New Feature Available", desc: "AI-powered proposal generator is now live — try it today!",      time: "2 days ago",  read: true  },
  { id: 8, type: "proposal", icon: "❌", title: "Proposal Not Selected", desc: "Your proposal for Logo Redesign – Café Brand was not selected",  time: "3 days ago",  read: true  },
];

export const FILTERS = ["All", "Payment", "Jobs", "Messages", "Proposals"];

export const TYPE_COLOR: Record<string, string> = {
  payment:  C.green,
  job:      C.yellow,
  message:  C.purple,
  proposal: C.blue,
  review:   "#f59e0b",
  system:   C.accent,
};