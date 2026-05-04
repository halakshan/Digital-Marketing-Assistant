"use client";

import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", fontFamily: "'Sora',sans-serif", textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Browse Jobs Not Available</h2>
      <p style={{ fontSize: 14, color: "#64748b", maxWidth: 380, lineHeight: 1.7 }}>
        In this platform, <strong style={{ color: "#a78bfa" }}>clients find and hire freelancers</strong> — not the other way around.
        Make sure your profile is complete so clients can discover you in the Marketplace.
      </p>
      <button
        onClick={() => router.push("/freelancer/profile")}
        style={{ marginTop: 24, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
      >
        Complete My Profile →
      </button>
    </div>
  );
}
