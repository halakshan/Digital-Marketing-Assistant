const STATS = [
  { label: "Active Freelancers", value: "500+", icon: "👥", color: "text-violet-400" },
  { label: "Skills Available",   value: "50+",  icon: "🛠️", color: "text-blue-400"   },
  { label: "Avg. Response",      value: "2hrs", icon: "⚡", color: "text-green-400"  },
  { label: "Success Rate",       value: "98%",  icon: "⭐", color: "text-yellow-400" },
];

export default function MarketplaceStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(s => (
        <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="text-2xl">{s.icon}</div>
          <div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}