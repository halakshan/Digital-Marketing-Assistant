interface Props {
  bizName: string;     setBizName: (v: string) => void;
  bizType: string;     setBizType: (v: string) => void;
  bizWebsite: string;  setBizWebsite: (v: string) => void;
  bizAddress: string;  setBizAddress: (v: string) => void;
  onSave: () => void;
}

export default function BusinessTab({ bizName, setBizName, bizType, setBizType, bizWebsite, setBizWebsite, bizAddress, setBizAddress, onSave }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="text-base font-bold mb-2">Business Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Business Name</label>
          <input value={bizName} onChange={e => setBizName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Business Type</label>
          <select value={bizType} onChange={e => setBizType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all">
            {["Fashion & Clothing","Food & Restaurant","Tech & Electronics","Health & Beauty","Real Estate","Education","Other"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Website URL</label>
          <input value={bizWebsite} onChange={e => setBizWebsite(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Business Address</label>
          <input value={bizAddress} onChange={e => setBizAddress(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
        </div>
      </div>
      <button type="button" onClick={onSave}
        className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
        Save Changes
      </button>
    </div>
  );
}