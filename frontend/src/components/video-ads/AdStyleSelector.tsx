import { AD_STYLES } from "./videoAdsData";

interface Props {
  adStyle: string;
  setAdStyle: (val: string) => void;
}

export default function AdStyleSelector({ adStyle, setAdStyle }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <label className="block text-sm font-bold text-gray-200 mb-3">Ad Style</label>
      <div className="grid grid-cols-2 gap-2">
        {AD_STYLES.map(s => (
          <button key={s.value} type="button" onClick={() => setAdStyle(s.value)}
            className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all ${
              adStyle === s.value
                ? "bg-pink-600/20 border-pink-500/50 text-white"
                : "bg-white/5 border-white/10 hover:border-pink-500/30 text-gray-400"
            }`}>
            <span className="text-lg">{s.label.split(" ")[0]}</span>
            <div>
              <div className="text-xs font-semibold">{s.label.split(" ").slice(1).join(" ")}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}