"use client";

import { C }       from "@/components/freelancer/dashboard/dashboardData";
import { Service } from "./servicesData";

interface Props {
  services: Service[];
}

export default function ServiceStats({ services }: Props) {
  const stats = [
    { label: "Total Services", val: services.length,                                   color: C.accent },
    { label: "Active",         val: services.filter(s => s.status === "active").length, color: C.green  },
    { label: "Total Orders",   val: services.reduce((a, s) => a + s.orders, 0),         color: C.blue   },
    { label: "Avg Rating",     val: "4.9 ⭐",                                            color: C.yellow },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{s.label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>
            {s.val}
          </p>
        </div>
      ))}
    </div>
  );
}