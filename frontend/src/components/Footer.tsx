export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10 text-center text-gray-500 text-sm">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          DM
        </div>
        <span className="font-semibold text-white">DM Assistant</span>
      </div>
      <p>© 2026 DM Assistant. Built for Sri Lankan SMEs. All rights reserved.</p>
    </footer>
  );
}