interface Props {
  text?: string;
}

export default function AuthDivider({ text = "or sign in with email" }: Props) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-gray-500 text-xs">{text}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}