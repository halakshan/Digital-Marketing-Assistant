"use client";

import { useState } from "react";
import { INITIAL_TOASTS, Toast } from "@/components/freelancer/dashboard/dashboardData";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

import NotificationToast from "@/components/shared/NotificationToast";
import ProfileBanner     from "@/components/freelancer/dashboard/ProfileBanner";
import StatsCards        from "@/components/freelancer/dashboard/StatsCards";
import ActiveProjects    from "@/components/freelancer/dashboard/ActiveProjects";
import MessagesWidget    from "@/components/freelancer/dashboard/MessagesWidget";
import EarningsChart     from "@/components/freelancer/dashboard/EarningsChart";
import JobMatches        from "@/components/freelancer/dashboard/JobMatches";
import QuickActions      from "@/components/freelancer/dashboard/QuickActions";
import ReviewsWidget     from "@/components/freelancer/dashboard/ReviewsWidget";

export default function FreelancerDashboard() {
  const { } = useFreelancerUser();
  const [toasts, setToasts] = useState<Toast[]>(INITIAL_TOASTS);
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  return (
    <div style={{ color: "#e2e8f0", fontFamily: "'Sora',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes slideIn { from{transform:translateX(30px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .toast-enter { animation: slideIn 0.28s ease forwards; }
        .blink       { animation: blink 2s infinite; }
        .lift:hover  { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.35); }
        .row:hover   { background:rgba(255,255,255,0.025) !important; }
        .qa:hover    { background:rgba(124,58,237,0.14) !important; border-color:rgba(124,58,237,0.4) !important; transform:translateY(-1px); }
        .bar:hover   { opacity:1 !important; }
      `}</style>

      <NotificationToast toasts={toasts} systemBarVisible={false} onClose={removeToast} />

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>

        <ProfileBanner />

        <StatsCards />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <ActiveProjects />
          <MessagesWidget />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <EarningsChart />
          <JobMatches />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <QuickActions />
            <ReviewsWidget />
          </div>
        </div>

      </div>
    </div>
  );
}