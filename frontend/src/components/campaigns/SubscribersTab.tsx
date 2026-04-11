"use client";

import { useState } from "react";

export interface Subscriber {
  id:      string;
  email:   string;
  name:    string;
  status:  string;
  addedAt: string;
}

interface Props {
  subscribers:  Subscriber[];
  loading:      boolean;
  onAdd:        (email: string, name: string) => Promise<void>;
  onBulkImport: (emails: string) => Promise<void>;
  onDelete:     (id: string) => void;
}

function fmtDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SubscribersTab({ subscribers, loading, onAdd, onBulkImport, onDelete }: Props) {
  const [mode,      setMode]      = useState<"list" | "add" | "bulk">("list");
  const [email,     setEmail]     = useState("");
  const [name,      setName]      = useState("");
  const [bulkText,  setBulkText]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSaving(true);
    await onAdd(email.trim(), name.trim());
    setEmail(""); setName(""); setMode("list");
    setSaving(false);
  };

  const handleBulk = async () => {
    if (!bulkText.trim()) return;
    setSaving(true);
    await onBulkImport(bulkText);
    setBulkText(""); setMode("list");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold">
            {loading ? "Loading…" : `${subscribers.filter(s => s.status === "active").length} Active Subscribers`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Emails sent to active subscribers when no custom list is set</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode(mode === "add" ? "list" : "add")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              mode === "add"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-white/5 border-white/10 text-gray-300 hover:border-blue-500/40"
            }`}>
            + Add Single
          </button>
          <button type="button" onClick={() => setMode(mode === "bulk" ? "list" : "bulk")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              mode === "bulk"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-white/5 border-white/10 text-gray-300 hover:border-blue-500/40"
            }`}>
            📋 Bulk Import
          </button>
        </div>
      </div>

      {/* Add single form */}
      {mode === "add" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold">Add Subscriber</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Email Address *</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="subscriber@example.com"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Name (optional)</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none transition-all" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={saving || !email.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              {saving ? "Adding…" : "Add Subscriber"}
            </button>
            <button type="button" onClick={() => setMode("list")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk import form */}
      {mode === "bulk" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-bold mb-1">Bulk Import Subscribers</p>
            <p className="text-xs text-gray-400">Paste email addresses separated by commas, semicolons, or new lines</p>
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6}
            placeholder={"john@example.com\njane@example.com\nkasun@business.lk, nimal@shop.lk\n..."}
            className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none font-mono" />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-500">
              Duplicates are automatically skipped
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleBulk} disabled={saving || !bulkText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                {saving ? "Importing…" : "Import Emails"}
              </button>
              <button type="button" onClick={() => setMode("list")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!loading && subscribers.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search subscribers…"
          className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 text-sm outline-none transition-all max-w-sm" />
      )}

      {/* Subscriber list */}
      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-0">
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/10 rounded w-1/3 animate-pulse" />
                <div className="h-2 bg-white/5 rounded w-1/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm font-semibold text-gray-300">
            {search ? "No subscribers match your search" : "No subscribers yet"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {!search && "Add subscribers above or use bulk import to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-5">Email</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Added</div>
          </div>
          {filtered.map((s, i) => (
            <div key={s.id}
              className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-all group ${
                i < filtered.length - 1 ? "border-b border-white/5" : ""
              }`}>
              {/* Avatar + email */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-white truncate">{s.email}</span>
              </div>
              {/* Name */}
              <div className="col-span-3">
                <span className="text-sm text-gray-400 truncate">{s.name || <span className="text-gray-600">—</span>}</span>
              </div>
              {/* Status */}
              <div className="col-span-2 flex justify-center">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  s.status === "active"
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                }`}>
                  {s.status}
                </span>
              </div>
              {/* Added date + delete */}
              <div className="col-span-2 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-600">{fmtDate(s.addedAt)}</span>
                <button type="button" onClick={() => onDelete(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs font-semibold transition-all ml-1">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
