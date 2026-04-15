export const ALL_NOTIFICATIONS = [
  {
    id: 1,  category: "ai",        read: false, time: "2 min ago",
    icon: "🤖", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30",
    title: "AI Content Generated",
    desc: "Your Instagram caption in Sinhala has been generated successfully. Click to view and copy.",
    action: "View Content", href: "/dashboard/ai-content",
  },
  {
    id: 2,  category: "freelancer", read: false, time: "15 min ago",
    icon: "👥", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30",
    title: "New Freelancer Bid",
    desc: "Kavya Perera has submitted a bid of LKR 12,000 for your Logo Design project.",
    action: "View Bid", href: "/dashboard/marketplace",
  },
  {
    id: 3,  category: "campaign",  read: false, time: "1 hr ago",
    icon: "📧", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30",
    title: "Campaign Delivered",
    desc: "Your Summer Sale Newsletter has been delivered to 842 subscribers. Open rate: 36.8%.",
    action: "View Report", href: "/dashboard/campaigns",
  },
  {
    id: 4,  category: "seo",       read: false, time: "2 hrs ago",
    icon: "📈", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30",
    title: "SEO Issues Detected",
    desc: "Our crawler found 3 new issues on your website including missing meta descriptions.",
    action: "Fix Issues", href: "/dashboard/seo",
  },
  {
    id: 5,  category: "payment",   read: true,  time: "3 hrs ago",
    icon: "💳", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30",
    title: "Payment Confirmed",
    desc: "Payment of LKR 3,500 to Kasun P. for logo design has been confirmed successfully.",
    action: "View Receipt", href: "/dashboard/settings",
  },
  {
    id: 6,  category: "system",    read: true,  time: "5 hrs ago",
    icon: "🚀", color: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/30",
    title: "New Feature: Video Ads",
    desc: "AI Video Ad Generator is now live! Create professional video ads powered by Google Veo 3.",
    action: "Try Now", href: "/dashboard/video-ads",
  },
  {
    id: 7,  category: "ai",        read: true,  time: "Yesterday",
    icon: "🤖", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30",
    title: "AI Post Limit Reached",
    desc: "You have used all 3 free AI posts this month. Upgrade to Pro for unlimited posts.",
    action: "Upgrade", href: "/dashboard/settings",
  },
  {
    id: 8,  category: "freelancer", read: true,  time: "Yesterday",
    icon: "👥", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30",
    title: "Project Completed",
    desc: "Rashan Fernando has marked your Video Editing project as completed. Please leave a review.",
    action: "Leave Review", href: "/dashboard/marketplace",
  },
  {
    id: 9,  category: "system",    read: true,  time: "2 days ago",
    icon: "⚠️", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30",
    title: "SMTP Connection Error",
    desc: "Your Gmail SMTP connection failed. Please re-enter your credentials in Settings.",
    action: "Fix Now", href: "/dashboard/settings",
  },
  {
    id: 10, category: "campaign",  read: true,  time: "2 days ago",
    icon: "📧", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30",
    title: "Campaign Scheduled",
    desc: "Your Weekly Newsletter #12 has been scheduled for March 6, 2026 at 9:00 AM.",
    action: "View Campaign", href: "/dashboard/campaigns",
  },
  {
    id: 11, category: "seo",       read: true,  time: "3 days ago",
    icon: "📈", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30",
    title: "SEO Score Improved",
    desc: "Your website SEO score improved from 72 to 76 this week. Keep optimizing!",
    action: "View Report", href: "/dashboard/seo",
  },
  {
    id: 12, category: "payment",   read: true,  time: "1 week ago",
    icon: "💳", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30",
    title: "Invoice Generated",
    desc: "Invoice #INV-2026-008 for LKR 8,500 has been generated for your Pro subscription.",
    action: "Download", href: "/dashboard/settings",
  },
];

export const CATEGORY_FILTERS = [
  { key: "all",        label: "All",        icon: "🔔" },
  { key: "ai",         label: "AI Content", icon: "🤖" },
  { key: "freelancer", label: "Freelancer", icon: "👥" },
  { key: "campaign",   label: "Campaigns",  icon: "📧" },
  { key: "seo",        label: "SEO",        icon: "📈" },
  { key: "payment",    label: "Payments",   icon: "💳" },
  { key: "system",     label: "System",     icon: "⚙️" },
];

export type Notification = typeof ALL_NOTIFICATIONS[0];