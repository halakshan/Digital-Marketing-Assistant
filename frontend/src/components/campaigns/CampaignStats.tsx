interface Props {
  totalSent:       number;
  openRate:        number;   // percentage 0–100
  clickRate:       number;   // percentage 0–100
  activeCampaigns: number;
  loading:         boolean;
}

export default function CampaignStats({ totalSent, openRate, clickRate, activeCampaigns, loading }: Props) {
  const STATS = [
    {
      label: "Total Sent",
      value: loading ? "—" : totalSent.toLocaleString(),
      icon: "📤", color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/30",
    },
    {
      label: "Avg. Open Rate",
      value: loading ? "—" : `${openRate.toFixed(1)}%`,
      icon: "👁️", color: "text-green-400",
      bg: "from-green-500/20 to-green-600/5", border: "border-green-500/30",
    },
    {
      label: "Avg. Click Rate",
      value: loading ? "—" : `${clickRate.toFixed(1)}%`,
      icon: "🖱️", color: "text-violet-400",
      bg: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/30",
    },
    {
      label: "Active Campaigns",
      value: loading ? "—" : activeCampaigns.toString(),
      icon: "🚀", color: "text-orange-400",
      bg: "from-orange-500/20 to-orange-600/5", border: "border-orange-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(s => (
        <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{s.icon}</span>
          </div>
          <div className={`text-3xl font-extrabold ${s.color} ${loading ? "opacity-40 animate-pulse" : ""}`}>
            {s.value}
          </div>
          <div className="text-xs text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
