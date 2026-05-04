"use client";

import { C }                          from "@/components/freelancer/dashboard/dashboardData";
import { NewServiceForm, EMPTY_FORM } from "./servicesData";

interface Props {
  form:      NewServiceForm;
  onChange:  (form: NewServiceForm) => void;
  onAdd:     () => void;
  onClose:   () => void;
}

const FIELDS = [
  { label: "Service Title", key: "title",    placeholder: "e.g. Logo Design Package",   type: "input"    },
  { label: "Description",   key: "desc",     placeholder: "Describe what you offer...", type: "textarea" },
  { label: "Price (LKR)",   key: "price",    placeholder: "e.g. LKR 35,000",            type: "input"    },
  { label: "Delivery Time", key: "delivery", placeholder: "e.g. 5 days",                type: "input"    },
];

export default function AddServiceModal({ form, onChange, onAdd, onClose }: Props) {
  const handleField = (key: string, val: string) =>
    onChange({ ...form, [key]: val });

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: 480 }}
      >
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Add New Service</p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Create a new service listing for clients</p>

        {FIELDS.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{f.label}</p>
            {f.type === "textarea" ? (
              <textarea
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => handleField(f.key, e.target.value)}
                rows={3}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", resize: "vertical", outline: "none" }}
              />
            ) : (
              <input
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => handleField(f.key, e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none" }}
              />
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onAdd}
            style={{ flex: 1, background: C.purple, color: "#fff", border: "none", padding: 11, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.purple;  e.currentTarget.style.transform = "translateY(0)";    }}
          >
            Add Service
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, background: "transparent", color: C.subtle, border: `1px solid ${C.border}`, padding: 11, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}