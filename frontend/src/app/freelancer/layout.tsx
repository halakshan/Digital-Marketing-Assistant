"use client";

import { FreelancerUserProvider, useFreelancerUser } from "@/context/FreelancerUserContext";
import FreelancerSidebar from "@/components/freelancer/dashboard/FreelancerSidebar";
import FreelancerTopbar  from "@/components/freelancer/dashboard/FreelancerTopbar";

function FreelancerShell({ children }: { children: React.ReactNode }) {
  const { userName, userInitial, userPhoto, category, authLoading } = useFreelancerUser();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          DM
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, fontFamily: "'Sora',sans-serif" }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0f1a", fontFamily: "'Sora',sans-serif" }}>
      <FreelancerSidebar
        userName={userName}
        userInitial={userInitial}
        userPhoto={userPhoto}
        category={category}
      />
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" }}>
        <FreelancerTopbar
          userName={userName}
          userInitial={userInitial}
          userPhoto={userPhoto}
        />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <FreelancerUserProvider>
      <FreelancerShell>{children}</FreelancerShell>
    </FreelancerUserProvider>
  );
}