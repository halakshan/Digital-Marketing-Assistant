"use client";

import { useState } from "react";

interface Props {
  onSaveDraft:     (name: string, subject: string, body: string, recipients: string, scheduleAt: string, customEmails: string) => Promise<void>;
  onSendNow:       (name: string, subject: string, body: string, recipients: string, scheduleAt: string, customEmails: string) => Promise<void>;
  subscriberCount: number;
  saving:          boolean;
  onViewCampaigns: () => void;
}

export default function ComposeForm({ onSaveDraft, onSendNow, subscriberCount, saving, onViewCampaigns }: Props) {
  const [name,         setName]         = useState("");
  const [subject,      setSubject]      = useState("");
  const [body,         setBody]         = useState("");
  const [scheduleAt,   setScheduleAt]   = useState("");
  const [customEmails, setCustomEmails] = useState("");
  const [useSubscribers, setUseSubscribers] = useState(false);
  const [sent,         setSent]         = useState(false);

  // Count valid emails entered
  const emailCount = customEmails
    .split(/[\n,;]+/)
    .filter(e => e.trim().includes("@")).length;

  const effectiveEmails = useSubscribers ? "" : customEmails;

  const handleSaveDraft = async () => {
    await onSaveDraft(name, subject, body, useSubscribers ? "subscribers" : "custom", scheduleAt, effectiveEmails);
  };

  const handleSendNow = async () => {
    await onSendNow(name, subject, body, useSubscribers ? "subscribers" : "custom", scheduleAt, effectiveEmails);
    setSent(true);
  };

  const handleReset = () => {
    setSent(false);
    setName(""); setSubject(""); setBody("");
    setCustomEmails(""); setScheduleAt(""); setUseSubscribers(false);
  };

  if (sent) {
    return (
      <div className="max-w-3xl">
        <div className="bg-gradient-to-r from-green-600/15 to-emerald-600/15 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-xl font-bold text-green-400 mb-2">Campaign Sent Successfully!</div>
          <div className="text-sm text-gray-400 mb-6">
            Your email campaign has been delivered to {useSubscribers ? "your subscribers" : `${emailCount} recipient${emailCount !== 1 ? "s" : ""}`}.
          </div>
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={onViewCampaigns}
              className="bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              View Campaigns
            </button>
            <button type="button" onClick={handleReset}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              + New Campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* SMTP status */}
      <div className="bg-gradient-to-r from-blue-600/15 to-cyan-600/15 border border-blue-500/25 rounded-2xl px-5 py-3.5 flex items-center gap-3">
        <span className="text-xl">📡</span>
        <div className="flex-1">
          <div className="text-sm font-bold">Sending from hlakshan312@gmail.com</div>
          <div className="text-xs text-gray-400">Gmail SMTP connected · emails deliver to real inboxes</div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold flex-shrink-0">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live
        </span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

        {/* Campaign Name */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
          <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0">NAME</span>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Campaign name (e.g. March Newsletter)"
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none" />
        </div>

        {/* To field — always visible */}
        <div className="border-b border-white/10">
          <div className="flex items-start gap-3 px-5 py-3.5">
            <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0 mt-0.5">TO</span>
            {useSubscribers ? (
              <div className="flex-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-semibold">
                    {subscriberCount > 0 ? `All Subscribers (${subscriberCount})` : "No subscribers yet"}
                  </span>
                  {subscriberCount === 0 && (
                    <span className="text-xs text-red-400">— add subscribers first</span>
                  )}
                </div>
                <button type="button" onClick={() => setUseSubscribers(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors flex-shrink-0">
                  Enter emails instead →
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <textarea
                  value={customEmails}
                  onChange={e => setCustomEmails(e.target.value)}
                  rows={3}
                  placeholder={"john@example.com, jane@example.com\nor paste one per line"}
                  className="w-full bg-transparent text-white placeholder-gray-600 text-sm outline-none resize-none font-mono leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-600">
                    {emailCount > 0
                      ? <span className="text-green-400">✓ {emailCount} valid email{emailCount !== 1 ? "s" : ""} detected</span>
                      : "Enter emails separated by commas or new lines"}
                  </span>
                  {subscriberCount > 0 && (
                    <button type="button" onClick={() => setUseSubscribers(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                      Use {subscriberCount} subscribers instead →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
          <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0">SUBJECT</span>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. 🌅 Big Summer Sale — Up to 50% Off!"
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none" />
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
            placeholder={"Write your email content here...\n\nDear {{name}},\n\nWe have an exciting offer just for you...\n\nBest regards,\nYour Team"}
            className="w-full bg-transparent text-white placeholder-gray-600 text-sm outline-none resize-none leading-relaxed" />
          <p className="text-xs text-gray-600 mt-2 border-t border-white/5 pt-2">
            💡 Use {"{{name}}"} to personalise · HTML tags supported · Gmail SMTP sends to real inboxes
          </p>
        </div>
      </div>

      {/* Schedule (optional) */}
      <div className="flex items-center gap-4">
        <label className="text-xs font-semibold text-gray-500 flex-shrink-0">SCHEDULE (optional)</label>
        <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
          className="bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2 text-white text-sm outline-none transition-all" />
        {scheduleAt && (
          <button type="button" onClick={() => setScheduleAt("")}
            className="text-xs text-gray-500 hover:text-white transition-colors">✕ Clear</button>
        )}
      </div>

      {/* Send buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={handleSaveDraft}
          disabled={saving || !name.trim() || !subject.trim() || !body.trim()}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {saving
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving…</>
            : "💾 Save as Draft"}
        </button>
        <button type="button" onClick={handleSendNow}
          disabled={saving || !name.trim() || !subject.trim() || !body.trim() || (!useSubscribers && emailCount === 0) || (useSubscribers && subscriberCount === 0)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
          {saving
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending…</>
            : scheduleAt ? "📅 Schedule Campaign" : `📤 Send to ${useSubscribers ? `${subscriberCount} subscribers` : `${emailCount} email${emailCount !== 1 ? "s" : ""}`}`}
        </button>
      </div>

      {/* Helpful hint if Send button is disabled */}
      {!useSubscribers && emailCount === 0 && (name || subject) && (
        <p className="text-xs text-amber-400 text-center">
          ⚠️ Enter at least one recipient email in the TO field above to send
        </p>
      )}
    </div>
  );
}
