const ROLES = [
  { val: "business",   label: "🏢 Business Owner", desc: "I want to market my business" },
  { val: "freelancer", label: "💼 Freelancer",      desc: "I want to offer my services"  },
];

interface Props {
  role: string;
  setRole: (val: string) => void;
}

export default function RoleSelector({ role, setRole }: Props) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-300 mb-2">I am a</label>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(r => (
          <button key={r.val} type="button" onClick={() => setRole(r.val)}
            className={`p-3 rounded-xl border text-left transition-all ${
              role === r.val
                ? "border-violet-500 bg-violet-500/15 text-white"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}>
            <div className="text-sm font-semibold">{r.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{r.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}