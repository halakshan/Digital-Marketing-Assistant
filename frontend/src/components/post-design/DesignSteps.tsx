type Step = "select" | "customize" | "preview";

interface Props {
  step: Step;
}

const STEPS = [
  { key: "select",    label: "1. Choose Template"  },
  { key: "customize", label: "2. Customize"        },
  { key: "preview",   label: "3. Preview & Export" },
];

export default function DesignSteps({ step }: Props) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const isActive = step === s.key;
        const isDone = (step === "customize" && s.key === "select") ||
                       (step === "preview" && s.key !== "preview");
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isActive
                ? "bg-white/15 border-white/40 text-white"
                : isDone
                ? "bg-green-600/15 border-green-500/30 text-green-400"
                : "bg-white/5 border-white/10 text-gray-500"
            }`}>
              {isDone ? "✓ " : ""}{s.label}
            </div>
            {i < 2 && <span className="text-gray-600">→</span>}
          </div>
        );
      })}
    </div>
  );
}