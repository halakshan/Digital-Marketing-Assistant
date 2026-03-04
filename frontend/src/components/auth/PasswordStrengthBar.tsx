const COLORS = ["bg-white/10", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const LABEL_COLORS = ["", "text-red-400", "text-yellow-400", "text-blue-400", "text-green-400"];

interface Props {
  password: string;
}

function getStrength(password: string): number {
  if (password.length === 0) return 0;
  if (password.length < 6)   return 1;
  if (password.length < 9)   return 2;
  if (password.length < 12)  return 3;
  return 4;
}

export default function PasswordStrengthBar({ password }: Props) {
  if (!password) return null;
  const strength = getStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? COLORS[strength] : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Strength:{" "}
        <span className={`font-semibold ${LABEL_COLORS[strength]}`}>
          {LABELS[strength]}
        </span>
      </p>
    </div>
  );
}