interface Props {
  openaiKey: string;   setOpenaiKey: (v: string) => void;
  smtpHost: string;    setSmtpHost: (v: string) => void;
  smtpPort: string;    setSmtpPort: (v: string) => void;
  smtpUser: string;    setSmtpUser: (v: string) => void;
  smtpPass: string;    setSmtpPass: (v: string) => void;
  smtpStatus: "idle" | "testing" | "success" | "error";
  onTestSMTP: () => void;
  onSave: () => void;
}

const OTHER_INTEGRATIONS = [
  { name: "Canva API",    icon: "🎨", desc: "Post design integration",    status: "Connect"   },
  { name: "Shopify",      icon: "🛒", desc: "eCommerce store integration", status: "Connect"   },
  { name: "Google Veo 3", icon: "🎬", desc: "AI video generation",         status: "Connected" },
];

export default function IntegrationsTab({
  openaiKey, setOpenaiKey,
  smtpHost, setSmtpHost, smtpPort, setSmtpPort,
  smtpUser, setSmtpUser, smtpPass, setSmtpPass,
  smtpStatus, onTestSMTP, onSave,
}: Props) {
  return (
    <div className="space-y-5">

      {/* OpenAI */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="text-sm font-bold">OpenAI API</div>
            <div className="text-xs text-gray-400">Powers AI content generation and SEO analysis</div>
          </div>
          <span className="ml-auto text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Connected
          </span>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block font-semibold">API Key</label>
          <input value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} type="password"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
        </div>
        <button type="button" onClick={onSave}
          className="mt-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 px-4 py-2 rounded-lg transition-all font-semibold">
          Update Key
        </button>
      </div>

      {/* SMTP */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📧</span>
          <div>
            <div className="text-sm font-bold">SMTP Email</div>
            <div className="text-xs text-gray-400">Used for sending email campaigns</div>
          </div>
          <span className={`ml-auto text-xs px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border ${
            smtpStatus === "success" ? "text-green-400 bg-green-500/10 border-green-500/20"  :
            smtpStatus === "error"   ? "text-red-400 bg-red-500/10 border-red-500/20"        :
            smtpStatus === "testing" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
            "text-gray-400 bg-white/5 border-white/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              smtpStatus === "success" ? "bg-green-400 animate-pulse" :
              smtpStatus === "error"   ? "bg-red-400"                 :
              smtpStatus === "testing" ? "bg-yellow-400 animate-spin" :
              "bg-gray-400"
            }`} />
            {smtpStatus === "success" ? "Connected" : smtpStatus === "error" ? "Failed" : smtpStatus === "testing" ? "Testing..." : "Not tested"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">SMTP Host</label>
            <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Port</label>
            <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Username</label>
            <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Password</label>
            <input value={smtpPass} onChange={e => setSmtpPass(e.target.value)} type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onTestSMTP} disabled={smtpStatus === "testing"}
            className="text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition-all font-semibold disabled:opacity-50">
            {smtpStatus === "testing" ? "Testing..." : "🔌 Test Connection"}
          </button>
          <button type="button" onClick={onSave}
            className="text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 px-4 py-2 rounded-lg transition-all font-semibold">
            Save SMTP
          </button>
        </div>
      </div>

      {/* Other Integrations */}
      {OTHER_INTEGRATIONS.map((int, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-2xl">{int.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-bold">{int.name}</div>
            <div className="text-xs text-gray-400">{int.desc}</div>
          </div>
          <button type="button"
            className={`text-xs px-4 py-2 rounded-lg font-semibold border transition-all ${
              int.status === "Connected"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-violet-300 bg-violet-600/20 border-violet-500/30 hover:bg-violet-600/30"
            }`}>
            {int.status === "Connected" ? "✓ Connected" : `+ ${int.status}`}
          </button>
        </div>
      ))}
    </div>
  );
}