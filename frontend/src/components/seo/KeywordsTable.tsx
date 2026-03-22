import { KEYWORDS } from "./seoData";

export default function KeywordsTable() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div className="col-span-4">Keyword</div>
        <div className="col-span-2 text-center">Volume</div>
        <div className="col-span-2 text-center">Difficulty</div>
        <div className="col-span-2 text-center">Rank</div>
        <div className="col-span-2 text-center">Change</div>
      </div>
      {KEYWORDS.map((kw, i) => (
        <div key={i} className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-all ${i < KEYWORDS.length - 1 ? "border-b border-white/5" : ""}`}>
          <div className="col-span-4 text-sm font-semibold">{kw.keyword}</div>
          <div className="col-span-2 text-center text-sm">{kw.volume.toLocaleString()}</div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${kw.difficulty >= 60 ? "bg-red-500" : kw.difficulty >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${kw.difficulty}%` }} />
              </div>
              <span className="text-xs text-gray-400">{kw.difficulty}</span>
            </div>
          </div>
          <div className="col-span-2 text-center">
            <span className={`text-sm font-bold ${kw.rank <= 5 ? "text-green-400" : kw.rank <= 10 ? "text-yellow-400" : "text-gray-400"}`}>
              #{kw.rank}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className={`text-sm font-bold ${kw.change.startsWith("+") ? "text-green-400" : kw.change === "0" ? "text-gray-400" : "text-red-400"}`}>
              {kw.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}