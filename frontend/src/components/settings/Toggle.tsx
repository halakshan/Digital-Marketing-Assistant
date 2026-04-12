interface Props {
  enabled: boolean;
  onChange: () => void;
}

export default function Toggle({ enabled, onChange }: Props) {
  return (
    <button type="button" onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${enabled ? "bg-violet-600" : "bg-white/20"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
    </button>
  );
}