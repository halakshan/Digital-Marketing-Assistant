import Link from "next/link";

interface Props {
  title: string;
  subtitle: string;
}

export default function AuthLogo({ title, subtitle }: Props) {
  return (
    <div className="text-center mb-8">
      <Link href="/" className="inline-flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base font-bold shadow-lg shadow-violet-900/40">
          DM
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          DM <span className="text-violet-400">Assistant</span>
        </span>
      </Link>
      <h1 className="text-3xl font-extrabold text-white mb-2">{title}</h1>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}