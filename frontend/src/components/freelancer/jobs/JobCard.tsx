"use client";

import { C } from "@/components/freelancer/dashboard/dashboardData";
import { Job } from "./jobsData";

interface Props {
  job:        Job;
  isSelected: boolean;
  onSelect:   (id: number) => void;
}

export default function JobCard({ job, isSelected, onSelect }: Props) {
  return (
    <div
      onClick={() => onSelect(job.id)}
      style={{
        background: C.card,
        border: `1px solid ${isSelected ? C.purple : C.border}`,
        borderRadius: 14, padding: "18px 20px",
        cursor: "pointer", transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
        e.currentTarget.style.transform   = "translateY(-2px)";
        e.currentTarget.style.boxShadow   = "0 8px 28px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isSelected ? C.purple : C.border;
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

        {/* Icon */}
        <div style={{ width: 48, height: 48, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {job.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{job.title}</p>
            {job.status === "urgent" && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontWeight: 700 }}>
                🔥 URGENT
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            👤 {job.client} &nbsp;•&nbsp; 🕐 {job.posted}
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {job.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: C.purpleGlow, border: "1px solid rgba(124,58,237,0.25)", color: C.accent, fontWeight: 500 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
            {job.budget}
          </p>
          <p style={{ fontSize: 12, color: C.muted }}>{job.type} • {job.duration}</p>
        </div>
      </div>

      {/* Expanded actions */}
      {isSelected && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button
            style={{ background: C.purple, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#6d28d9")}
            onMouseLeave={e => (e.currentTarget.style.background = C.purple)}
          >
            ✍️ Send Proposal
          </button>
          <button
            style={{ background: "transparent", color: C.accent, border: `1px solid rgba(124,58,237,0.4)`, padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            🔖 Save Job
          </button>
          <button
            style={{ background: "transparent", color: C.subtle, border: `1px solid ${C.border}`, padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            👁 View Details
          </button>
        </div>
      )}
    </div>
  );
}