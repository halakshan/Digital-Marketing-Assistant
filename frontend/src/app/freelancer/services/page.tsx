"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFreelancerUser } from "@/context/FreelancerUserContext";

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg:          "#0d0f1a",
  surface:     "#111827",
  card:        "#1a2035",
  border:      "rgba(255,255,255,0.08)",
  text:        "#e2e8f0",
  muted:       "#64748b",
  subtle:      "#94a3b8",
  accent:      "#7c3aed",
  accent2:     "#3b82f6",
  purple:      "#7c3aed",
  purpleGlow:  "rgba(124,58,237,0.15)",
  green:       "#22c55e",
  yellow:      "#eab308",
  red:         "#ef4444",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ICONS = ["💼","🎨","🎬","💻","📸","✍️","📣","🎵","🌐","📊","📱","🖼️"];

const CATEGORIES = ["Design","Development","Video","Photography","Writing","Marketing","Other"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id:           string;
  freelancerUid: string;
  title:        string;
  description:  string;
  price:        string;
  delivery:     string;
  category:     string;
  icon:         string;
  status:       "active" | "paused";
  orders:       number;
  rating:       number;
  createdAt:    Timestamp | null;
  updatedAt:    Timestamp | null;
}

interface ServiceForm {
  icon:        string;
  title:       string;
  category:    string;
  description: string;
  price:       string;
  delivery:    string;
}

const EMPTY_FORM: ServiceForm = {
  icon:        "💼",
  title:       "",
  category:    "Design",
  description: "",
  price:       "",
  delivery:    "",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; text: string; kind: "success" | "error" }

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:  t.kind === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          border:      `1px solid ${t.kind === "success" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
          color:       t.kind === "success" ? C.green : C.red,
          padding:     "12px 20px",
          borderRadius: 10,
          fontSize:    13,
          fontWeight:  600,
          boxShadow:   "0 4px 24px rgba(0,0,0,0.4)",
          animation:   "slideInToast 0.25s ease",
          fontFamily:  "'Sora',sans-serif",
        }}>
          {t.kind === "success" ? "✓ " : "✕ "}{t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? C.yellow : C.border, fontSize: 12 }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{rating > 0 ? rating.toFixed(1) : "—"}</span>
    </span>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  onToggle,
  onDelete,
  onEdit,
}: {
  service:  Service;
  onToggle: (id: string, status: "active" | "paused") => void;
  onDelete: (id: string) => void;
  onEdit:   (service: Service) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{
        background:   C.card,
        border:       `1px solid ${hovered ? "rgba(124,58,237,0.3)" : C.border}`,
        borderRadius: 16,
        padding:      22,
        display:      "flex",
        flexDirection: "column",
        gap:          14,
        transition:   "all 0.18s",
        boxShadow:    hovered ? "0 6px 28px rgba(0,0,0,0.35)" : "none",
        transform:    hovered ? "translateY(-2px)" : "none",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width:        48,
            height:       48,
            borderRadius: 12,
            background:   C.purpleGlow,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            fontSize:     24,
          }}>
            {service.icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{service.title}</div>
            <span style={{
              fontSize:     11,
              fontWeight:   600,
              color:        C.accent2,
              background:   "rgba(59,130,246,0.12)",
              border:       "1px solid rgba(59,130,246,0.25)",
              padding:      "2px 8px",
              borderRadius: 6,
            }}>
              {service.category}
            </span>
          </div>
        </div>

        <span style={{
          fontSize:     11,
          fontWeight:   700,
          color:        service.status === "active" ? C.green : C.yellow,
          background:   service.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
          border:       `1px solid ${service.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"}`,
          padding:      "4px 10px",
          borderRadius: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {service.status}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize:   13,
        color:      C.subtle,
        margin:     0,
        lineHeight: 1.6,
        overflow:   "hidden",
        display:    "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {service.description || "No description provided."}
      </p>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Price</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{service.price || "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Delivery</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{service.delivery || "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Orders</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{service.orders}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Rating</span>
          <Stars rating={service.rating} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => onEdit(service)}
          style={{
            flex:         1,
            background:   "transparent",
            color:        C.subtle,
            border:       `1px solid ${C.border}`,
            padding:      "8px 0",
            borderRadius: 8,
            fontSize:     13,
            fontWeight:   600,
            cursor:       "pointer",
            fontFamily:   "'Sora',sans-serif",
            transition:   "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.4)"; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.subtle; }}
        >
          ✎ Edit
        </button>
        <button
          onClick={() => onToggle(service.id, service.status)}
          style={{
            flex:         1,
            background:   service.status === "active" ? "rgba(234,179,8,0.10)" : "rgba(34,197,94,0.10)",
            color:        service.status === "active" ? C.yellow : C.green,
            border:       `1px solid ${service.status === "active" ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)"}`,
            padding:      "8px 0",
            borderRadius: 8,
            fontSize:     13,
            fontWeight:   600,
            cursor:       "pointer",
            fontFamily:   "'Sora',sans-serif",
            transition:   "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {service.status === "active" ? "⏸ Pause" : "▶ Resume"}
        </button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(service.id)}
            style={{
              flex:         1,
              background:   "rgba(239,68,68,0.18)",
              color:        C.red,
              border:       "1px solid rgba(239,68,68,0.4)",
              padding:      "8px 0",
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   700,
              cursor:       "pointer",
              fontFamily:   "'Sora',sans-serif",
            }}
          >
            Confirm?
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              flex:         1,
              background:   "rgba(239,68,68,0.08)",
              color:        C.red,
              border:       "1px solid rgba(239,68,68,0.2)",
              padding:      "8px 0",
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "'Sora',sans-serif",
              transition:   "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Service Modal ────────────────────────────────────────────────────────────
function ServiceModal({
  mode,
  form,
  onChange,
  onSubmit,
  onClose,
  submitting,
}: {
  mode:       "add" | "edit";
  form:       ServiceForm;
  onChange:   (form: ServiceForm) => void;
  onSubmit:   () => void;
  onClose:    () => void;
  submitting: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width:        "100%",
    background:   C.surface,
    border:       `1px solid ${C.border}`,
    borderRadius: 8,
    padding:      "10px 14px",
    color:        C.text,
    fontSize:     14,
    fontFamily:   "'Sora',sans-serif",
    outline:      "none",
    boxSizing:    "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize:    12,
    fontWeight:  600,
    color:       C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
    display:     "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:   "fixed",
        inset:      0,
        background: "rgba(0,0,0,0.7)",
        zIndex:     1000,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   C.card,
          border:       `1px solid ${C.border}`,
          borderRadius: 20,
          padding:      32,
          width:        "100%",
          maxWidth:     560,
          maxHeight:    "90vh",
          overflowY:    "auto",
          boxShadow:    "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            {mode === "add" ? "Add New Service" : "Edit Service"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background:   "rgba(255,255,255,0.06)",
              border:       `1px solid ${C.border}`,
              color:        C.muted,
              borderRadius: 8,
              width:        32,
              height:       32,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              cursor:       "pointer",
              fontSize:     18,
              fontFamily:   "'Sora',sans-serif",
            }}
          >
            ×
          </button>
        </div>

        {/* Icon Picker */}
        <div style={{ marginBottom: 20 }}>
          <span style={labelStyle}>Icon</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => onChange({ ...form, icon })}
                style={{
                  width:        44,
                  height:       44,
                  borderRadius: 10,
                  background:   form.icon === icon ? C.purpleGlow : "rgba(255,255,255,0.04)",
                  border:       `1px solid ${form.icon === icon ? C.purple : C.border}`,
                  fontSize:     22,
                  cursor:       "pointer",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  transition:   "all 0.15s",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Title *</label>
          <input
            value={form.title}
            onChange={e => onChange({ ...form, title: e.target.value })}
            placeholder="e.g. Professional Logo Design"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Category</label>
          <select
            value={form.category}
            onChange={e => onChange({ ...form, category: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} style={{ background: C.surface }}>{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => onChange({ ...form, description: e.target.value })}
            placeholder="Describe what's included in this service…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* Price & Delivery */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
          <div>
            <label style={labelStyle}>Price</label>
            <input
              value={form.price}
              onChange={e => onChange({ ...form, price: e.target.value })}
              placeholder="e.g. LKR 5,000"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Delivery Time</label>
            <input
              value={form.delivery}
              onChange={e => onChange({ ...form, delivery: e.target.value })}
              placeholder="e.g. 3 days"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex:         1,
              background:   "transparent",
              color:        C.subtle,
              border:       `1px solid ${C.border}`,
              padding:      "11px 0",
              borderRadius: 10,
              fontSize:     14,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "'Sora',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !form.title.trim()}
            style={{
              flex:         2,
              background:   submitting || !form.title.trim() ? "rgba(124,58,237,0.4)" : C.purple,
              color:        "#fff",
              border:       "none",
              padding:      "11px 0",
              borderRadius: 10,
              fontSize:     14,
              fontWeight:   700,
              cursor:       submitting || !form.title.trim() ? "default" : "pointer",
              fontFamily:   "'Sora',sans-serif",
              transition:   "all 0.18s",
            }}
          >
            {submitting ? "Saving…" : mode === "add" ? "+ Add Service" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ services }: { services: Service[] }) {
  const total   = services.length;
  const active  = services.filter(s => s.status === "active").length;
  const paused  = services.filter(s => s.status === "paused").length;
  const orders  = services.reduce((sum, s) => sum + (s.orders || 0), 0);

  const stats = [
    { label: "Total Services", value: total,  color: C.accent2 },
    { label: "Active",         value: active, color: C.green   },
    { label: "Paused",         value: paused, color: C.yellow  },
    { label: "Total Orders",   value: orders, color: C.purple  },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background:   C.surface,
          border:       `1px solid ${C.border}`,
          borderRadius: 14,
          padding:      "18px 20px",
          display:      "flex",
          flexDirection: "column",
          gap:          6,
        }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {s.label}
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "80px 0",
      textAlign:      "center",
      background:     C.surface,
      borderRadius:   20,
      border:         `1px dashed ${C.border}`,
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🛠️</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>No services yet</h3>
      <p style={{ fontSize: 14, color: C.muted, margin: "0 0 28px", maxWidth: 340, lineHeight: 1.6 }}>
        Showcase your skills by adding services that clients can browse and purchase.
      </p>
      <button
        onClick={onAdd}
        style={{
          background:   C.purple,
          color:        "#fff",
          border:       "none",
          padding:      "12px 28px",
          borderRadius: 10,
          fontSize:     14,
          fontWeight:   700,
          cursor:       "pointer",
          fontFamily:   "'Sora',sans-serif",
          transition:   "all 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.purple;  e.currentTarget.style.transform = "translateY(0)";    }}
      >
        + Add Your First Service
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const { uid, authLoading } = useFreelancerUser();

  const [services,    setServices]    = useState<Service[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form,        setForm]        = useState<ServiceForm>(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [toasts,      setToasts]      = useState<ToastMsg[]>([]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const addToast = useCallback((text: string, kind: "success" | "error") => {
    const id = Date.now();
    setToasts(p => [...p, { id, text, kind }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Firestore real-time listener ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !uid) return;

    const q = query(
      collection(db, "freelancer_services"),
      where("freelancerUid", "==", uid)
    );

    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Service, "id">),
      }));
      // Sort client-side by createdAt desc
      docs.sort((a, b) => {
        const aMs = a.createdAt ? a.createdAt.toMillis() : 0;
        const bMs = b.createdAt ? b.createdAt.toMillis() : 0;
        return bMs - aMs;
      });
      setServices(docs);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [uid, authLoading]);

  // ── Open modals ───────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM);
    setShowAdd(true);
  }

  function openEdit(service: Service) {
    setForm({
      icon:        service.icon        || "💼",
      title:       service.title       || "",
      category:    service.category    || "Design",
      description: service.description || "",
      price:       service.price       || "",
      delivery:    service.delivery    || "",
    });
    setEditService(service);
  }

  function closeAll() {
    setShowAdd(false);
    setEditService(null);
    setForm(EMPTY_FORM);
  }

  // ── Add service ───────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!form.title.trim() || !uid) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "freelancer_services"), {
        freelancerUid: uid,
        title:         form.title.trim(),
        description:   form.description.trim(),
        price:         form.price.trim(),
        delivery:      form.delivery.trim(),
        category:      form.category,
        icon:          form.icon,
        status:        "active",
        orders:        0,
        rating:        0,
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      });
      addToast("Service added successfully!", "success");
      closeAll();
    } catch {
      addToast("Failed to add service. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit service ──────────────────────────────────────────────────────────
  async function handleEdit() {
    if (!editService || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "freelancer_services", editService.id), {
        title:       form.title.trim(),
        description: form.description.trim(),
        price:       form.price.trim(),
        delivery:    form.delivery.trim(),
        category:    form.category,
        icon:        form.icon,
        updatedAt:   serverTimestamp(),
      });
      addToast("Service updated!", "success");
      closeAll();
    } catch {
      addToast("Failed to update service.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Toggle status ─────────────────────────────────────────────────────────
  async function handleToggle(id: string, currentStatus: "active" | "paused") {
    try {
      await updateDoc(doc(db, "freelancer_services", id), {
        status:    currentStatus === "active" ? "paused" : "active",
        updatedAt: serverTimestamp(),
      });
      addToast(currentStatus === "active" ? "Service paused." : "Service resumed!", "success");
    } catch {
      addToast("Failed to update status.", "error");
    }
  }

  // ── Delete service ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "freelancer_services", id));
      addToast("Service deleted.", "success");
    } catch {
      addToast("Failed to delete service.", "error");
    }
  }

  if (authLoading) {
    return (
      <div style={{ padding: 28, color: C.text, fontFamily: "'Sora',sans-serif" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Sora',sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${C.muted}; }
        select option { background: ${C.surface}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @keyframes slideInToast { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>My Services</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Manage the services you offer to clients</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            background:   C.purple,
            color:        "#fff",
            border:       "none",
            padding:      "10px 22px",
            borderRadius: 10,
            fontSize:     14,
            fontWeight:   600,
            cursor:       "pointer",
            fontFamily:   "'Sora',sans-serif",
            transition:   "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.purple;  e.currentTarget.style.transform = "translateY(0)";    }}
        >
          + Add New Service
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <StatsBar services={services} />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontSize: 14 }}>
          Loading services…
        </div>
      ) : services.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
          {services.map(s => (
            <ServiceCard
              key={s.id}
              service={s}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      {showAdd && (
        <ServiceModal
          mode="add"
          form={form}
          onChange={setForm}
          onSubmit={handleAdd}
          onClose={closeAll}
          submitting={submitting}
        />
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editService && (
        <ServiceModal
          mode="edit"
          form={form}
          onChange={setForm}
          onSubmit={handleEdit}
          onClose={closeAll}
          submitting={submitting}
        />
      )}

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <Toast toasts={toasts} />
    </div>
  );
}
