import { Freelancer } from "./freelancerData";

interface Props {
  freelancer: Freelancer;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function HireModal({ freelancer: f, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-lg font-bold mb-1">Hire {f.name}?</div>
        <div className="text-sm text-gray-400 mb-5">
          Send a hire request to this freelancer. They will be notified and can accept or decline.
        </div>
        <div className={`bg-gradient-to-r ${f.gradient} p-4 rounded-xl mb-5 flex items-center gap-3`}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-lg">
            {f.avatar}
          </div>
          <div>
            <div className="font-bold">{f.name}</div>
            <div className="text-sm opacity-80">{f.role} · {f.rate}</div>
          </div>
        </div>
        <textarea rows={3} placeholder="Describe your project requirements..."
          className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none mb-4" />
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 rounded-xl font-bold text-sm transition-all">
            Send Hire Request
          </button>
        </div>
      </div>
    </div>
  );
}