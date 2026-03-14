import Link from "next/link";

const QUICK_ACTIONS = [
  { icon: "🤖", label: "Generate AI Post", href: "/dashboard/ai-content",  color: "from-violet-600 to-indigo-600" },
  { icon: "🎬", label: "Create Video Ad",  href: "/dashboard/video-ads",   color: "from-violet-600 to-indigo-600" },
  { icon: "🎨", label: "Design Post",      href: "/dashboard/post-design", color: "from-violet-600 to-indigo-600" },
  { icon: "📧", label: "Email Campaign",   href: "/dashboard/campaigns",   color: "from-violet-600 to-indigo-600" },
  { icon: "📈", label: "SEO Report",       href: "/dashboard/seo",         color: "from-violet-600 to-indigo-600" },
  { icon: "👥", label: "Hire Freelancer",  href: "/dashboard/marketplace", color: "from-violet-600 to-indigo-600" },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-base font-bold mb-4 text-gray-200">Quick Actions</h2>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.label} href={a.href}
            className={`bg-gradient-to-br ${a.color} hover:opacity-90 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 shadow-lg`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-semibold text-center leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}