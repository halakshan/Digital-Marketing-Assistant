"use client";

interface SentLog {
  id:      string;
  email:   string;
  name:    string;
  status:  string;
  sentAt:  string;
  opened:  boolean;
  clicked: boolean;
}

interface Campaign {
  id:        string;
  name:      string;
  subject:   string;
  status:    string;
  sent:      number;
  opened:    number;
  clicked:   number;
  createdAt: string;
  sentAt?:   string | null;
}

interface Props {
  campaign: Campaign;
  logs:     SentLog[];
  loading:  boolean;
  onClose:  () => void;
}

function fmtDate(raw?: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "—"
    : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SentDetailsModal({ campaign, logs, loading, onClose }: Props) {
  const openRate  = campaign.sent > 0 ? ((campaign.opened  / campaign.sent) * 100).toFixed(1) : "0.0";
  const clickRate = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : "0.0";

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">{campaign.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{campaign.subject}</p>
            <p className="text-xs text-gray-600 mt-1">Sent {fmtDate(campaign.sentAt)}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors ml-4">✕</button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/10">
          {[
            { label: "Sent",       value: campaign.sent.toLocaleString(), color: "text-blue-400"   },
            { label: "Opened",     value: campaign.opened.toLocaleString(), color: "text-green-400" },
            { label: "Open Rate",  value: `${openRate}%`,  color: "text-green-400"  },
            { label: "Click Rate", value: `${clickRate}%`, color: "text-violet-400" },
          ].map(s => (
            <div key={s.label} className="bg-[#0d0d1a] px-4 py-4 text-center">
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recipient list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                  <div className="flex-1 h-3 bg-white/10 rounded animate-pulse" />
                  <div className="w-12 h-5 bg-white/5 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm text-gray-400">No recipient data available</p>
              <p className="text-xs text-gray-600 mt-1">Logs are saved after each send</p>
            </div>
          ) : (
            <>
              {/* List header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-6">Recipient</div>
                <div className="col-span-3 text-center">Sent At</div>
                <div className="col-span-3 text-center">Status</div>
              </div>

              {logs.map((log, i) => (
                <div key={log.id}
                  className={`grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-white/[0.03] transition-all ${
                    i < logs.length - 1 ? "border-b border-white/5" : ""
                  }`}>
                  {/* Email */}
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0 text-blue-400">
                      {log.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{log.email}</p>
                      {log.name && <p className="text-xs text-gray-500">{log.name}</p>}
                    </div>
                  </div>
                  {/* Sent at */}
                  <div className="col-span-3 text-center">
                    <p className="text-xs text-gray-400">{fmtDate(log.sentAt)}</p>
                  </div>
                  {/* Status badges */}
                  <div className="col-span-3 flex justify-center gap-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-green-500/15 text-green-400 border-green-500/30">
                      ✓ Sent
                    </span>
                    {log.opened && (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-blue-500/15 text-blue-400 border-blue-500/30">
                        Opened
                      </span>
                    )}
                    {log.clicked && (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-violet-500/15 text-violet-400 border-violet-500/30">
                        Clicked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {logs.length} recipient{logs.length !== 1 ? "s" : ""} in log
          </p>
          <button type="button" onClick={onClose}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
