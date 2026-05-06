"use client";

import { C }                from "@/components/freelancer/dashboard/dashboardData";
import { Project, STATUS_MAP } from "./projectData";
import MilestoneTracker     from "./MilestoneTracker";
import ProjectActions       from "./ProjectActions";

interface Props {
  project:  Project;
  isOpen:   boolean;
  onToggle: (id: number) => void;
}

export default function ProjectCard({ project: p, isOpen, onToggle }: Props) {
  const st = STATUS_MAP[p.status as keyof typeof STATUS_MAP];

  return (
    <div style={{ background: C.card, border: `1px solid ${isOpen ? C.purple : C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>

      {/* Header row */}
      <div
        onClick={() => onToggle(p.id)}
        style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
      >
        {/* Icon */}
        <div style={{ width: 48, height: 48, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {p.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.title}</p>
          <p style={{ fontSize: 12, color: C.muted }}>👤 {p.client} &nbsp;•&nbsp; 📅 Due: {p.due}</p>
        </div>

        {/* Budget */}
        <div style={{ textAlign: "right", marginRight: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>
            {p.budget}
          </p>
          <p style={{ fontSize: 12, color: C.muted }}>Paid: {p.paid}</p>
        </div>

        {/* Status badge */}
        <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0 }}>
          {st.label}
        </span>

        {/* Arrow */}
        <span style={{ color: C.muted, fontSize: 14, marginLeft: 8 }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.muted }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>
            {p.progress}%
          </span>
        </div>
        <div style={{ height: 6, background: C.surface, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p.progress}%`, background: `linear-gradient(90deg,${C.purple},${C.accent})`, borderRadius: 10, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingTop: 16 }}>
            <MilestoneTracker milestones={p.milestones} />
            <ProjectActions />
          </div>
        </div>
      )}
    </div>
  );
}