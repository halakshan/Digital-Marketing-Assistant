import { SEO_ISSUES, issueStyle } from "./seoData";

interface Props {
  filterType: string;
  setFilterType: (val: string) => void;
}

export default function IssuesList({ filterType, setFilterType }: Props) {
  const filtered = filterType === "all"
    ? SEO_ISSUES
    : SEO_ISSUES.filter(i => i.type === filterType);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "error", "warning", "info"].map(f => (
          <button key={f} type="button" onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              filterType === f
                ? "bg-green-600/20 border-green-500/40 text-green-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-green-500/30"
            }`}>
            {f === "all" ? "All Issues" : f === "error" ? "🔴 Errors" : f === "warning" ? "🟡 Warnings" : "🔵 Info"}
          </button>
        ))}
      </div>

      {/* Issues */}
      <div className="space-y-3">
        {filtered.map((issue, i) => {
          const style = issueStyle(issue.type);
          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${style.badge} flex items-center justify-center text-lg flex-shrink-0 border`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <div className="text-sm font-bold">{issue.title}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${style.badge}`}>{issue.type}</span>
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed mb-3">{issue.desc}</div>
                  <button type="button"
                    className="text-xs font-semibold text-green-400 hover:text-green-300 transition-colors bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                    🔧 {issue.fix}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}