import { PAGES } from "./seoData";

export default function PagesTable() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div className="col-span-4">Page</div>
        <div className="col-span-3 text-center">SEO Score</div>
        <div className="col-span-2 text-center">Issues</div>
        <div className="col-span-3 text-center">Monthly Traffic</div>
      </div>
      {PAGES.map((p, i) => (
        <div key={i} className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-all ${i < PAGES.length - 1 ? "border-b border-white/5" : ""}`}>
          <div className="col-span-4">
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-gray-500">{p.url}</div>
          </div>
          <div className="col-span-3 flex items-center justify-center gap-2">
            <div className="h-2 w-20 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${p.score >= 80 ? "bg-green-500" : p.score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${p.score}%` }} />
            </div>
            <span className={`text-sm font-bold ${p.score >= 80 ? "text-green-400" : p.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
              {p.score}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className={`text-sm font-semibold ${p.issues > 3 ? "text-red-400" : p.issues > 1 ? "text-yellow-400" : "text-green-400"}`}>
              {p.issues} {p.issues === 1 ? "issue" : "issues"}
            </span>
          </div>
          <div className="col-span-3 text-center text-sm font-semibold">{p.traffic.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}