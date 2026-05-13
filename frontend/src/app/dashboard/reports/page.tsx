"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useIsFreelancer } from "@/hooks/useIsFreelancer";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportData {
  aiContent:       { total: number; byType: Record<string, number> };
  emailCampaigns:  { total: number; sent: number };
  seoAnalyses:     { total: number };
  socialPosts:     { total: number; byPlatform: Record<string, number> };
  videoAds:        { total: number };
  adCampaigns:     { total: number; totalBudget: number };
  hireRequests:    { asClient: number; completed: number; asFreelancer: number };
  subscribers:     { total: number };
  reviews:         { total: number; avgRating: number };
  calendarPosts:   { total: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function inRange(ts: any, start: Date, end: Date): boolean {
  if (!ts) return false;
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d >= start && d <= end;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Star display ──────────────────────────────────────────────────────────────
function Stars({ r }: { r: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(r) ? "text-yellow-400" : "text-white/15"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white">{value}</div>
        <div className="text-xs text-gray-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-5">
      <h3 className="font-bold text-white flex items-center gap-2 mb-4">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({ label, value, accent = "text-white" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-bold ${accent}`}>{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const router = useRouter();

  // Auth / layout state
  const [firebaseUser,  setFirebaseUser]  = useState<any>(null);
  const [uid,           setUid]           = useState("");
  const isFreelancer = useIsFreelancer(uid || undefined);
  const [userName,      setUserName]      = useState("User");
  const [userInitial,   setUserInitial]   = useState("U");
  const [userPhoto,     setUserPhoto]     = useState("");
  const [userPlan,      setUserPlan]      = useState("Free Plan");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  // Month selector — default to current month
  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth()); // 0-indexed

  // Data state
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push("/login"); return; }
      setFirebaseUser(user);
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
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
      } catch {}
    });
    return () => unsub();
  }, [router]);

  // ── Fetch report data ──
  const fetchReport = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const { start, end } = monthRange(selYear, selMonth);

    try {
      // Helper: fetch a collection filtered by userId, then client-side date-filter
      const byUser = async (col: string, field = "userId") => {
        const snap = await getDocs(query(collection(db, col), where(field, "==", uid)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      };

      const [
        aiDocs, emailDocs, seoDocs, socialDocs,
        videoDocs, adDocs, clientHireDocs, freHireDocs,
        subDocs, reviewDocs, calDocs,
      ] = await Promise.all([
        byUser("ai_content"),
        byUser("email_campaigns"),
        byUser("seo_analyses"),
        byUser("social_posts"),
        byUser("video_ads"),
        byUser("ad_campaigns"),
        byUser("hire_requests", "clientUid"),
        byUser("hire_requests", "freelancerUid"),
        byUser("subscribers"),
        getDocs(query(collection(db, "reviews"), where("freelancerUid", "==", uid))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() } as any))),
        byUser("calendar_posts"),
      ]);

      const inM = (doc: any) => inRange(doc.createdAt, start, end);

      // AI Content
      const aiInMonth = aiDocs.filter(inM);
      const aiByType: Record<string, number> = {};
      aiInMonth.forEach(d => { const t = d.type || d.contentType || "other"; aiByType[t] = (aiByType[t] || 0) + 1; });

      // Email Campaigns
      const emailInMonth = emailDocs.filter(inM);
      const emailSent = emailInMonth.filter(d => d.status === "sent" || d.sentAt).length;

      // SEO
      const seoInMonth = seoDocs.filter(inM);

      // Social Posts
      const socialInMonth = socialDocs.filter(inM);
      const socialByPlatform: Record<string, number> = {};
      socialInMonth.forEach(d => { const p = d.platform || "other"; socialByPlatform[p] = (socialByPlatform[p] || 0) + 1; });

      // Video Ads
      const videoInMonth = videoDocs.filter(inM);

      // Ad Campaigns
      const adInMonth = adDocs.filter(inM);
      const adBudget = adInMonth.reduce((s: number, d: any) => s + (parseFloat(d.budget) || 0), 0);

      // Hire Requests
      const clientHireInMonth  = clientHireDocs.filter(inM);
      const clientCompleted    = clientHireDocs.filter(d => d.status === "completed" && inM(d)).length;
      const freHireInMonth     = freHireDocs.filter(d => d.freelancerUid === uid && inM(d)).length;

      // Reviews (all time, for freelancers)
      const avgRating = reviewDocs.length
        ? Math.round((reviewDocs.reduce((s: number, d: any) => s + (d.stars || 0), 0) / reviewDocs.length) * 10) / 10
        : 0;

      // Calendar Posts
      const calInMonth = calDocs.filter(inM);

      setData({
        aiContent:      { total: aiInMonth.length, byType: aiByType },
        emailCampaigns: { total: emailInMonth.length, sent: emailSent },
        seoAnalyses:    { total: seoInMonth.length },
        socialPosts:    { total: socialInMonth.length, byPlatform: socialByPlatform },
        videoAds:       { total: videoInMonth.length },
        adCampaigns:    { total: adInMonth.length, totalBudget: adBudget },
        hireRequests:   { asClient: clientHireInMonth.length, completed: clientCompleted, asFreelancer: freHireInMonth },
        subscribers:    { total: subDocs.length },
        reviews:        { total: reviewDocs.length, avgRating },
        calendarPosts:  { total: calInMonth.length },
      });
    } catch (err) {
      console.error("fetchReport:", err);
    } finally {
      setLoading(false);
    }
  }, [uid, selYear, selMonth]);

  useEffect(() => {
    if (uid) fetchReport();
  }, [uid, fetchReport]);

  // ── PDF Export ──
  const exportPDF = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 0;

      // ── Header band ──
      doc.setFillColor(17, 17, 35);
      doc.rect(0, 0, W, 38, "F");
      doc.setFillColor(109, 40, 217);
      doc.rect(0, 0, W, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("DM Assistant", 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 210);
      doc.text("Monthly Performance Report", 14, 24);
      doc.text(monthLabel(selYear, selMonth), 14, 31);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 150);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}`, W - 14, 31, { align: "right" });

      y = 48;

      // ── Section helper ──
      const sectionTitle = (title: string) => {
        doc.setFillColor(30, 30, 50);
        doc.roundedRect(14, y, W - 28, 8, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(200, 180, 255);
        doc.text(title, 18, y + 5.5);
        y += 13;
      };

      const statLine = (label: string, value: string | number, accent = false) => {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(160, 160, 180);
        doc.text(String(label), 20, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(accent ? 167 : 240, accent ? 139 : 240, accent ? 250 : 240);
        doc.text(String(value), W - 14, y, { align: "right" });
        doc.setDrawColor(50, 50, 70);
        doc.line(20, y + 1.5, W - 14, y + 1.5);
        y += 8;
      };

      // ── KPI summary bar ──
      const totalActivity =
        data.aiContent.total + data.emailCampaigns.total + data.seoAnalyses.total +
        data.socialPosts.total + data.videoAds.total + data.adCampaigns.total + data.calendarPosts.total;

      const kpis = [
        { label: "AI Content", value: data.aiContent.total, color: [109, 40, 217] as [number,number,number] },
        { label: "Campaigns",  value: data.emailCampaigns.total, color: [6, 182, 212] as [number,number,number] },
        { label: "SEO Runs",   value: data.seoAnalyses.total, color: [34, 197, 94] as [number,number,number] },
        { label: "Social",     value: data.socialPosts.total, color: [249, 115, 22] as [number,number,number] },
      ];
      const cardW = (W - 28 - 9) / 4;
      kpis.forEach((k, i) => {
        const x = 14 + i * (cardW + 3);
        doc.setFillColor(22, 22, 40);
        doc.roundedRect(x, y, cardW, 22, 3, 3, "F");
        doc.setFillColor(...k.color);
        doc.roundedRect(x, y, cardW, 2, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text(String(k.value), x + cardW / 2, y + 13, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 160);
        doc.text(k.label, x + cardW / 2, y + 19, { align: "center" });
      });
      y += 30;

      // Total activity pill
      doc.setFillColor(109, 40, 217, 40);
      doc.roundedRect(14, y, W - 28, 9, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(200, 180, 255);
      doc.text(`Total activities this month: ${totalActivity}`, W / 2, y + 6, { align: "center" });
      y += 17;

      // ── AI Content ──
      sectionTitle("🤖  AI Content");
      statLine("Content pieces generated", data.aiContent.total, true);
      Object.entries(data.aiContent.byType).forEach(([t, c]) =>
        statLine(`  › ${t.charAt(0).toUpperCase() + t.slice(1)}`, c)
      );
      if (!data.aiContent.total) statLine("No AI content generated this month", "—");
      y += 4;

      // ── Email Campaigns ──
      sectionTitle("📧  Email Campaigns");
      statLine("Campaigns created", data.emailCampaigns.total, true);
      statLine("Campaigns sent", data.emailCampaigns.sent);
      statLine("Total subscribers", data.subscribers.total);
      y += 4;

      // ── SEO Analyses ──
      sectionTitle("📈  SEO Analyses");
      statLine("Analyses run", data.seoAnalyses.total, true);
      y += 4;

      // ── Social & Video ──
      sectionTitle("📱  Social Posts & Video Ads");
      statLine("Social posts published", data.socialPosts.total, true);
      Object.entries(data.socialPosts.byPlatform).forEach(([p, c]) =>
        statLine(`  › ${p.charAt(0).toUpperCase() + p.slice(1)}`, c)
      );
      statLine("Video ads created", data.videoAds.total);
      statLine("Calendar posts scheduled", data.calendarPosts.total);
      y += 4;

      // ── Ad Campaigns ──
      sectionTitle("📢  Ad Campaigns");
      statLine("Campaigns launched", data.adCampaigns.total, true);
      statLine("Total budget allocated", data.adCampaigns.totalBudget > 0 ? `LKR ${data.adCampaigns.totalBudget.toLocaleString()}` : "—");
      y += 4;

      // ── Marketplace ──
      sectionTitle("👥  Freelancer Marketplace");
      statLine("Hire requests sent (as client)", data.hireRequests.asClient, true);
      statLine("Projects completed (as client)", data.hireRequests.completed);
      if (isFreelancer) {
        statLine("Hire requests received (as freelancer)", data.hireRequests.asFreelancer, true);
        statLine("Reviews received (all time)", data.reviews.total);
        statLine("Average rating (all time)", data.reviews.avgRating > 0 ? `${data.reviews.avgRating} / 5` : "No reviews yet");
      }
      y += 4;

      // ── Footer ──
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(17, 17, 35);
      doc.rect(0, doc.internal.pageSize.getHeight() - 14, W, 14, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 130);
      doc.text("DM Assistant — AI-Powered Digital Marketing Platform", 14, doc.internal.pageSize.getHeight() - 5);
      doc.text(`Page 1`, W - 14, doc.internal.pageSize.getHeight() - 5, { align: "right" });

      doc.save(`DM-Report-${selYear}-${String(selMonth + 1).padStart(2, "0")}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // ── Month nav helpers ──
  const prevMonth = () => {
    if (selMonth === 0) { setSelYear(y => y - 1); setSelMonth(11); }
    else setSelMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
    if (isCurrentMonth) return; // can't go into the future
    if (selMonth === 11) { setSelYear(y => y + 1); setSelMonth(0); }
    else setSelMonth(m => m + 1);
  };
  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();

  // ── Totals for summary ──
  const totalActivity = data
    ? data.aiContent.total + data.emailCampaigns.total + data.seoAnalyses.total +
      data.socialPosts.total + data.videoAds.total + data.adCampaigns.total + data.calendarPosts.total
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <Sidebar sidebarOpen={sidebarOpen} activeLink="Monthly Reports" setActiveLink={() => {}}
        userName={userName} userInitial={userInitial} userPhoto={userPhoto}
        userPlan={userPlan} isFreelancer={isFreelancer} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)}
          userName={userName} userInitial={userInitial} userPhoto={userPhoto} />

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold">📊 Monthly Reports</h1>
              <p className="text-sm text-gray-400 mt-1">Track your marketing performance and export as PDF</p>
            </div>
            <button
              onClick={exportPDF}
              disabled={!data || loading || exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20"
            >
              {exporting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Exporting…</>
              ) : (
                <>📄 Export PDF</>
              )}
            </button>
          </div>

          {/* ── Month Selector ── */}
          <div className="flex items-center gap-4">
            <button onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-lg">
              ‹
            </button>
            <div className="bg-[#0d0d1a] border border-violet-500/30 rounded-xl px-6 py-2.5 min-w-[180px] text-center">
              <span className="font-bold text-white">{monthLabel(selYear, selMonth)}</span>
              {isCurrentMonth && <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-bold">Current</span>}
            </div>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-lg disabled:opacity-30">
              ›
            </button>
            <button onClick={fetchReport} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-all disabled:opacity-40">
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /> : "🔄"} Refresh
            </button>
          </div>

          {loading ? (
            /* ── Loading skeleton ── */
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-[#0d0d1a] border border-white/10 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 bg-[#0d0d1a] border border-white/10 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">

              {/* ── KPI Summary ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon="🤖" label="AI Content Generated" value={data.aiContent.total}      color="bg-violet-500/15" />
                <KpiCard icon="📧" label="Email Campaigns"       value={data.emailCampaigns.total} color="bg-cyan-500/15"   />
                <KpiCard icon="📱" label="Social Posts"          value={data.socialPosts.total}    color="bg-orange-500/15" />
                <KpiCard icon="📢" label="Ad Campaigns"          value={data.adCampaigns.total}    color="bg-pink-500/15"   />
              </div>

              {/* ── Total Activity Banner ── */}
              <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/10 border border-violet-500/25 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Total Activities in {monthLabel(selYear, selMonth)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Across all marketing channels</p>
                </div>
                <div className="text-4xl font-extrabold text-violet-400">{totalActivity}</div>
              </div>

              {/* ── Detail Sections (2-col grid) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* AI Content */}
                <Section icon="🤖" title="AI Content">
                  <StatRow label="Content pieces generated" value={data.aiContent.total} accent="text-violet-400" />
                  {Object.entries(data.aiContent.byType).length > 0
                    ? Object.entries(data.aiContent.byType).map(([t, c]) => (
                        <StatRow key={t} label={`› ${t.charAt(0).toUpperCase() + t.slice(1)}`} value={c} />
                      ))
                    : <StatRow label="No content yet this month" value="—" />
                  }
                </Section>

                {/* Email Campaigns */}
                <Section icon="📧" title="Email Campaigns">
                  <StatRow label="Campaigns created"    value={data.emailCampaigns.total} accent="text-cyan-400" />
                  <StatRow label="Campaigns sent"        value={data.emailCampaigns.sent} />
                  <StatRow label="Total subscribers"     value={data.subscribers.total} accent="text-green-400" />
                </Section>

                {/* SEO */}
                <Section icon="📈" title="SEO Analytics">
                  <StatRow label="Analyses run this month" value={data.seoAnalyses.total} accent="text-green-400" />
                </Section>

                {/* Social & Video */}
                <Section icon="📱" title="Social Posts & Video">
                  <StatRow label="Social posts published"    value={data.socialPosts.total}    accent="text-orange-400" />
                  {Object.entries(data.socialPosts.byPlatform).map(([p, c]) => (
                    <StatRow key={p} label={`› ${p.charAt(0).toUpperCase() + p.slice(1)}`} value={c} />
                  ))}
                  <StatRow label="Video ads created"         value={data.videoAds.total}       accent="text-red-400" />
                  <StatRow label="Calendar posts scheduled"  value={data.calendarPosts.total}  />
                </Section>

                {/* Ad Campaigns */}
                <Section icon="📢" title="Ad Campaigns">
                  <StatRow label="Campaigns launched"  value={data.adCampaigns.total} accent="text-pink-400" />
                  <StatRow label="Total budget"
                    value={data.adCampaigns.totalBudget > 0 ? `LKR ${data.adCampaigns.totalBudget.toLocaleString()}` : "—"} />
                </Section>

                {/* Marketplace */}
                <Section icon="👥" title="Freelancer Marketplace">
                  <StatRow label="Hire requests sent"       value={data.hireRequests.asClient}    accent="text-indigo-400" />
                  <StatRow label="Projects completed"        value={data.hireRequests.completed}   accent="text-green-400" />
                  {isFreelancer && (
                    <>
                      <StatRow label="Jobs received (as freelancer)" value={data.hireRequests.asFreelancer} accent="text-violet-400" />
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-gray-400">Average rating</span>
                        <div className="flex items-center gap-1.5">
                          {data.reviews.avgRating > 0 ? (
                            <>
                              <Stars r={data.reviews.avgRating} />
                              <span className="text-sm font-bold text-yellow-400">{data.reviews.avgRating}</span>
                              <span className="text-xs text-gray-500">({data.reviews.total} reviews)</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">No reviews yet</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Section>
              </div>

              {/* ── Export hint ── */}
              <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-3 flex items-center gap-3 text-xs text-gray-500">
                <span>💡</span>
                <span>Click <strong className="text-gray-300">Export PDF</strong> at the top to download a professional PDF report for {monthLabel(selYear, selMonth)}.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-gray-300 mb-2">No data loaded</h3>
              <p className="text-sm text-gray-500 mb-4">Select a month and hit Refresh to load your report.</p>
              <button onClick={fetchReport} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-all">
                Load Report
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
