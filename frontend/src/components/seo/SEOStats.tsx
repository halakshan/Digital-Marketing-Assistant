import { STATS } from "./seoData";

export default function SEOStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(s => (
        <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{s.icon}</span>
            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">{s.change}</span>
          </div>
          <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}