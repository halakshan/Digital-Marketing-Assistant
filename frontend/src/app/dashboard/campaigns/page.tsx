"use client";

import { useState, useEffect }           from "react";
import { useRouter }                      from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc }                    from "firebase/firestore";
import { auth, db }                       from "@/lib/firebase";
import { useIsFreelancer }                from "@/hooks/useIsFreelancer";

import Sidebar            from "@/components/dashboard/Sidebar";
import Topbar             from "@/components/dashboard/Topbar";
import CampaignStats      from "@/components/campaigns/CampaignStats";
import CampaignTable, { Campaign }      from "@/components/campaigns/CampaignTable";
import ComposeForm        from "@/components/campaigns/ComposeForm";
import EmailTemplates     from "@/components/campaigns/EmailTemplates";
import SubscribersTab, { Subscriber }   from "@/components/campaigns/SubscribersTab";
import SentDetailsModal   from "@/components/campaigns/SentDetailsModal";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;
type Tab  = "campaigns" | "compose" | "ai" | "templates" | "subscribers";

interface AiContent { subject: string; preheader: string; greeting: string; body: string; cta: string; signature: string; }
interface SentLog   { id: string; email: string; name: string; status: string; sentAt: string; opened: boolean; clicked: boolean; }

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const router = useRouter();

  // ── Auth ──
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isFreelancer = useIsFreelancer(firebaseUser?.uid);
  const [userName,     setUserName]     = useState("");
  const [userInitial,  setUserInitial]  = useState("U");
  const [userPhoto,    setUserPhoto]    = useState("");
  const [userPlan,     setUserPlan]     = useState("Free Plan");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeLink,   setActiveLink]   = useState("Email Campaigns");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d    = snap.data();
          const name = d.fullName || user.displayName || "User";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(d.profilePhoto || user.photoURL || "");
          setUserPlan(d.plan === "pro" ? "Pro Plan" : d.plan === "business" ? "Business Plan" : "Free Plan");
        } else {
          const name = user.displayName || "User";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          setUserPhoto(user.photoURL || "");
        }
      } catch {
        const name = user.displayName || "User";
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      }
    });
    return () => unsub();
  }, [router]);

  const getToken = async (): Promise<string | null> =>
    firebaseUser ? getIdToken(firebaseUser) : null;

  // ── UI state ──
  const [tab,          setTab]          = useState<Tab>("campaigns");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showSuccess = (msg: string) => { setToast({ msg, type: "success" }); setTimeout(() => setToast(null), 4000); };
  const showError   = (msg: string) => { setToast({ msg, type: "error"   }); setTimeout(() => setToast(null), 5000); };

  // ── Campaigns ──────────────────────────────────────────────────────────────
  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [camLoading, setCamLoading] = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [sending,    setSending]    = useState<string | null>(null);

  const fetchCampaigns = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res  = await fetch(`${API}/email/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
    } catch { showError("Failed to load campaigns"); }
    finally  { setCamLoading(false); }
  };

  useEffect(() => {
    if (!firebaseUser) return;
    setCamLoading(true);
    fetchCampaigns();
  }, [firebaseUser]);

  // Computed stats
  const sentCampaigns   = campaigns.filter(c => c.sent > 0);
  const totalSent       = campaigns.reduce((s, c) => s + (c.sent || 0), 0);
  const avgOpenRate     = sentCampaigns.length > 0
    ? sentCampaigns.reduce((s, c) => s + (c.opened / c.sent) * 100, 0) / sentCampaigns.length : 0;
  const avgClickRate    = sentCampaigns.length > 0
    ? sentCampaigns.reduce((s, c) => s + (c.clicked / c.sent) * 100, 0) / sentCampaigns.length : 0;
  const activeCampaigns = campaigns.filter(c => c.status === "sent" || c.status === "scheduled").length;

  // Create + save draft
  const handleSaveDraft = async (
    name: string, subject: string, body: string,
    recipients: string, scheduleAt: string, customEmails: string
  ) => {
    if (!name.trim())    { showError("Campaign name is required"); return; }
    if (!subject.trim()) { showError("Subject line is required");  return; }
    if (!body.trim())    { showError("Email body is required");    return; }
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/create`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name, subject, body, recipients, customEmails, scheduleAt: scheduleAt || undefined }),
      });
      const data = await res.json();
      if (res.ok) { showSuccess("Campaign saved as draft!"); await fetchCampaigns(); setTab("campaigns"); }
      else          showError(data.message || "Failed to save campaign");
    } catch { showError("Failed to save campaign"); }
    finally  { setSaving(false); }
  };

  // Create + send immediately
  const handleSendNow = async (
    name: string, subject: string, body: string,
    recipients: string, scheduleAt: string, customEmails: string
  ) => {
    if (!name.trim())    { showError("Campaign name is required"); return; }
    if (!subject.trim()) { showError("Subject line is required");  return; }
    if (!body.trim())    { showError("Email body is required");    return; }
    setSaving(true);
    try {
      const token     = await getToken();
      const createRes = await fetch(`${API}/email/create`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name, subject, body, recipients, customEmails, scheduleAt: scheduleAt || undefined }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) { showError(createData.message || "Failed to create"); return; }

      const token2  = await getToken();
      const sendRes = await fetch(`${API}/email/${createData.id}/send`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token2}` },
      });
      const sendData = await sendRes.json();
      if (sendRes.ok) { showSuccess(sendData.message || "Campaign sent!"); await fetchCampaigns(); setTab("campaigns"); }
      else              showError(sendData.message || "Failed to send");
    } catch { showError("Failed to send campaign"); }
    finally  { setSaving(false); }
  };

  // Send existing draft
  const handleSendCampaign = async (id: string) => {
    setSending(id);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/${id}/send`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { showSuccess(data.message || "Campaign sent!"); await fetchCampaigns(); }
      else          showError(data.message || "Failed to send");
    } catch { showError("Failed to send campaign"); }
    finally  { setSending(null); }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setCampaigns(prev => prev.filter(c => c.id !== id)); showSuccess("Campaign deleted"); }
      else          showError("Failed to delete");
    } catch { showError("Failed to delete campaign"); }
  };

  // ── Sent details modal ──────────────────────────────────────────────────────
  const [viewCampaign,   setViewCampaign]   = useState<Campaign | null>(null);
  const [sentLogs,       setSentLogs]       = useState<SentLog[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleViewDetails = async (id: string) => {
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;
    setViewCampaign(camp);
    setDetailsLoading(true);
    setSentLogs([]);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/${id}/details`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (res.ok) setSentLogs(data.logs || []);
      else          showError("Failed to load sent details");
    } catch { showError("Failed to load sent details"); }
    finally  { setDetailsLoading(false); }
  };

  // ── Subscribers ─────────────────────────────────────────────────────────────
  const [subscribers,  setSubscribers]  = useState<Subscriber[]>([]);
  const [subLoading,   setSubLoading]   = useState(false);

  const fetchSubscribers = async () => {
    const token = await getToken();
    if (!token) return;
    setSubLoading(true);
    try {
      const res  = await fetch(`${API}/email/subscribers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.subscribers) setSubscribers(data.subscribers);
    } catch { showError("Failed to load subscribers"); }
    finally  { setSubLoading(false); }
  };

  useEffect(() => {
    if (firebaseUser && tab === "subscribers" && subscribers.length === 0 && !subLoading) {
      fetchSubscribers();
    }
  }, [tab, firebaseUser]);

  const handleAddSubscriber = async (email: string, name: string) => {
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/subscribers/add`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok) { showSuccess(`${email} added!`); await fetchSubscribers(); }
      else          showError(data.message || "Failed to add subscriber");
    } catch { showError("Failed to add subscriber"); }
  };

  const handleBulkImport = async (emails: string) => {
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/subscribers/bulk`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (res.ok) { showSuccess(data.message); await fetchSubscribers(); }
      else          showError(data.message || "Failed to import");
    } catch { showError("Failed to import subscribers"); }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/subscribers/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setSubscribers(prev => prev.filter(s => s.id !== id)); showSuccess("Subscriber removed"); }
      else          showError("Failed to remove subscriber");
    } catch { showError("Failed to remove subscriber"); }
  };

  // ── AI Generate ─────────────────────────────────────────────────────────────
  const [aiForm,    setAiForm]    = useState({ product: "", audience: "", tone: "professional", type: "promotional" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<AiContent | null>(null);

  const handleAiGenerate = async () => {
    if (!aiForm.product.trim()) { showError("Enter your product or service"); return; }
    setAiLoading(true); setAiContent(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/email/generate-content`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(aiForm),
      });
      const data = await res.json();
      if (res.ok && data.content) setAiContent(data.content);
      else showError(data.message || "Failed to generate content");
    } catch { showError("AI generation failed"); }
    finally  { setAiLoading(false); }
  };

  const activeSubscriberCount = subscribers.filter(s => s.status === "active").length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar
        sidebarOpen={sidebarOpen} activeLink={activeLink} setActiveLink={setActiveLink}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto} userPlan={userPlan}
        isFreelancer={isFreelancer}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {toast && <Toast msg={toast.msg} type={toast.type} />}

          {/* Sent details modal */}
          {viewCampaign && (
            <SentDetailsModal
              campaign={viewCampaign}
              logs={sentLogs}
              loading={detailsLoading}
              onClose={() => { setViewCampaign(null); setSentLogs([]); }}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold">📧 Email Campaigns</h1>
              <p className="text-xs text-gray-400">Create, send and track your email marketing campaigns</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setTab("subscribers"); fetchSubscribers(); }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs font-semibold transition-all">
                👥 {activeSubscriberCount > 0 ? `${activeSubscriberCount} Subscribers` : "Manage Subscribers"}
              </button>
              <button type="button" onClick={() => setTab("compose")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                + New Campaign
              </button>
            </div>
          </div>

          {/* Stats */}
          <CampaignStats
            totalSent={totalSent} openRate={avgOpenRate} clickRate={avgClickRate}
            activeCampaigns={activeCampaigns} loading={camLoading}
          />

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/10 overflow-x-auto">
            {([
              { key: "campaigns",   label: "📋 All Campaigns"  },
              { key: "compose",     label: "✏️ Compose"          },
              { key: "ai",          label: "🤖 AI Generate"     },
              { key: "templates",   label: "📄 Templates"       },
              { key: "subscribers", label: "👥 Subscribers"     },
            ] as { key: Tab; label: string }[]).map(t => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                  tab === t.key
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}>{t.label}</button>
            ))}
          </div>

          {/* ── Campaigns tab ── */}
          {tab === "campaigns" && (
            <CampaignTable
              campaigns={campaigns} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              onDelete={handleDelete} onSend={handleSendCampaign} onView={handleViewDetails}
              sending={sending} loading={camLoading}
            />
          )}

          {/* ── Compose tab ── */}
          {tab === "compose" && (
            <ComposeForm
              onSaveDraft={handleSaveDraft} onSendNow={handleSendNow}
              subscriberCount={activeSubscriberCount}
              saving={saving} onViewCampaigns={() => setTab("campaigns")}
            />
          )}

          {/* ── AI Generate tab ── */}
          {tab === "ai" && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h2 className="text-base font-bold">AI Email Generator</h2>
                    <p className="text-xs text-gray-400">Powered by Gemini — generates a full email in seconds</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Product / Service *</label>
                    <input value={aiForm.product} onChange={e => setAiForm(f => ({ ...f, product: e.target.value }))}
                      placeholder="e.g. Online fashion store"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Target Audience</label>
                    <input value={aiForm.audience} onChange={e => setAiForm(f => ({ ...f, audience: e.target.value }))}
                      placeholder="e.g. Young professionals in Sri Lanka"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Tone</label>
                    <select value={aiForm.tone} onChange={e => setAiForm(f => ({ ...f, tone: e.target.value }))}
                      className="w-full bg-[#0d0d1a] border border-white/10 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all">
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="exciting">Exciting</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Email Type</label>
                    <select value={aiForm.type} onChange={e => setAiForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-[#0d0d1a] border border-white/10 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all">
                      <option value="promotional">Promotional</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="welcome">Welcome</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleAiGenerate} disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                  {aiLoading
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating…</>
                    : "✨ Generate Email Content"}
                </button>
              </div>

              {aiContent && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">✨ Generated Content</h3>
                    <button onClick={() => { setTab("compose"); showSuccess("Content ready — paste it in Compose"); }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                      Use in Compose →
                    </button>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 space-y-3">
                    {aiContent.subject   && <div><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Subject</p><p className="text-sm font-semibold text-white">{aiContent.subject}</p></div>}
                    {aiContent.preheader && <div className="border-t border-white/5 pt-3"><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preheader</p><p className="text-sm text-gray-300 italic">{aiContent.preheader}</p></div>}
                  </div>
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-white/10">Email Preview</div>
                    <div className="p-5 space-y-3 text-sm">
                      {aiContent.greeting  && <p className="font-semibold text-white">{aiContent.greeting}</p>}
                      {aiContent.body      && <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{aiContent.body}</p>}
                      {aiContent.cta       && <div><span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold">{aiContent.cta}</span></div>}
                      {aiContent.signature && <p className="text-gray-500 text-xs border-t border-white/10 pt-3 whitespace-pre-wrap">{aiContent.signature}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Templates tab ── */}
          {tab === "templates" && (
            <EmailTemplates onUseTemplate={() => setTab("compose")} />
          )}

          {/* ── Subscribers tab ── */}
          {tab === "subscribers" && (
            <SubscribersTab
              subscribers={subscribers}
              loading={subLoading}
              onAdd={handleAddSubscriber}
              onBulkImport={handleBulkImport}
              onDelete={handleDeleteSubscriber}
            />
          )}

        </main>
      </div>
    </div>
  );
}
