import { KEYWORDS } from "./seoData";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = 36, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#ffffff10" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-extrabold" style={{ color }}>{score}</div>
        <div className="text-xs text-gray-500">/ 100</div>
      </div>
    </div>
  );
}

interface Props {
  onGoToIssues: (type: string) => void;
  onGoToKeywords: () => void;
}

export default function SEOOverview({ onGoToIssues, onGoToKeywords }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Score Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
        <h3 className="text-sm font-bold text-gray-200 self-start">Overall SEO Score</h3>
        <ScoreRing score={76} />
        <div className="w-full space-y-2">
          {[
            { label: "Technical SEO", score: 82 },
            { label: "On-Page SEO",   score: 71 },
            { label: "Performance",   score: 68 },
            { label: "Mobile SEO",    score: 85 },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-semibold">{item.score}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.score >= 80 ? "bg-green-500" : item.score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-200 mb-4">Issues Summary</h3>
        <div className="space-y-3">
          {[
            { type: "error",   label: "Critical Errors", count: 2, color: "text-red-400",    bg: "bg-red-500"    },
            { type: "warning", label: "Warnings",        count: 3, color: "text-yellow-400", bg: "bg-yellow-500" },
            { type: "info",    label: "Suggestions",     count: 2, color: "text-blue-400",   bg: "bg-blue-500"   },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${item.bg}/20 flex items-center justify-center ${item.color} font-extrabold text-lg flex-shrink-0`}>
                {item.count}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div className={`h-full ${item.bg} rounded-full`} style={{ width: `${(item.count / 7) * 100}%` }} />
                </div>
              </div>
              <button type="button" onClick={() => onGoToIssues(item.type)}
                className={`text-xs ${item.color} hover:opacity-80 transition-colors font-semibold`}>Fix →</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onGoToIssues("all")}
          className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-semibold transition-all">
          View All Issues →
        </button>
      </div>

      {/* Top Keywords */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-200 mb-4">Top Ranking Keywords</h3>
        <div className="space-y-3">
          {KEYWORDS.slice(0, 5).map((kw, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                {kw.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{kw.keyword}</div>
                <div className="text-xs text-gray-500">{kw.volume.toLocaleString()} vol/mo</div>
              </div>
              <span className={`text-xs font-bold ${kw.change.startsWith("+") ? "text-green-400" : kw.change === "0" ? "text-gray-400" : "text-red-400"}`}>
                {kw.change}
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onGoToKeywords}
          className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-semibold transition-all">
          View All Keywords →
        </button>
      </div>
    </div>
  );
}