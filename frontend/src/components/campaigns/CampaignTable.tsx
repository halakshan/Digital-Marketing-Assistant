export interface Campaign {
  id:        string;
  name:      string;
  subject:   string;
  status:    "draft" | "sent" | "scheduled";
  sent:      number;
  opened:    number;
  clicked:   number;
  createdAt: string;
}

function statusStyle(s: string) {
  if (s === "sent")      return "bg-green-500/15 text-green-400 border-green-500/30";
  if (s === "scheduled") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (s === "sending")   return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    sent: "bg-green-400", scheduled: "bg-blue-400", sending: "bg-yellow-400", draft: "bg-gray-400",
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] ?? "bg-gray-400"} inline-block`} />;
}

function fmtDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  campaigns:       Campaign[];
  filterStatus:    string;
  setFilterStatus: (val: string) => void;
  onDelete:        (id: string) => void;
  onSend:          (id: string) => void;
  onView:          (id: string) => void;
  sending:         string | null;
  loading:         boolean;
}

export default function CampaignTable({
  campaigns, filterStatus, setFilterStatus,
  onDelete, onSend, onView, sending, loading,
}: Props) {
  const filtered = filterStatus === "all"
    ? campaigns
    : campaigns.filter(c => c.status === filterStatus);

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "sent", "scheduled", "draft"].map(f => (
            <div key={f} className="h-7 w-20 bg-white/5 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/5 last:border-0">
              <div className="col-span-4 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <div className="h-3 w-10 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="col-span-2 flex justify-center items-center">
                <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="col-span-2 flex justify-center items-center gap-2">
                <div className="h-3 w-8 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-14 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {["all", "sent", "scheduled", "draft"].map(f => (
          <button key={f} type="button" onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              filterStatus === f
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-blue-500/30"
            }`}>{f}</button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-semibold text-gray-300">No campaigns found</p>
          <p className="text-xs text-gray-500 mt-1">
            {filterStatus === "all"
              ? "Create your first campaign to get started"
              : `No ${filterStatus} campaigns yet`}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Campaign</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Sent</div>
            <div className="col-span-2 text-center">Open Rate</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((c, i) => (
            <div key={c.id}
              className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-all ${
                i < filtered.length - 1 ? "border-b border-white/5" : ""
              }`}>

              {/* Campaign info */}
              <div className="col-span-4 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{c.subject}</div>
                <div className="text-xs text-gray-600 mt-0.5">{fmtDate(c.createdAt)}</div>
              </div>

              {/* Status */}
              <div className="col-span-2 flex justify-center">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${statusStyle(c.status)}`}>
                  <StatusDot status={c.status} />
                  {c.status}
                </span>
              </div>

              {/* Sent count */}
              <div className="col-span-2 text-center">
                <div className="text-sm font-semibold">
                  {c.sent > 0 ? c.sent.toLocaleString() : "—"}
                </div>
              </div>

              {/* Open rate */}
              <div className="col-span-2 text-center">
                {c.sent > 0 ? (
                  <div>
                    <div className="text-sm font-semibold text-green-400">
                      {((c.opened / c.sent) * 100).toFixed(1)}%
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1 mx-auto w-16">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min((c.opened / c.sent) * 100, 100)}%` }} />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-center items-center gap-2 flex-wrap">
                {c.status === "sent" && (
                  <>
                    <button type="button" onClick={() => onView(c.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                      View
                    </button>
                    <span className="text-gray-700">·</span>
                  </>
                )}
                {c.status === "draft" && (
                  <>
                    <button type="button" onClick={() => onSend(c.id)} disabled={sending === c.id}
                      className="text-xs text-green-400 hover:text-green-300 font-semibold transition-colors disabled:opacity-40">
                      {sending === c.id ? "Sending…" : "Send"}
                    </button>
                    <span className="text-gray-700">·</span>
                  </>
                )}
                <button type="button" onClick={() => onDelete(c.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
