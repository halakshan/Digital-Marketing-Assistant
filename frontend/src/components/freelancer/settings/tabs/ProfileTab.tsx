"use client";

import { C }            from "@/components/freelancer/dashboard/dashboardData";
import { ProfileForm }  from "../settingsData";
import SettingsField    from "../SettingsField";

interface Props {
  form:      ProfileForm;
  onChange:  (form: ProfileForm) => void;
}

const LANGUAGES = [
  { label: "Sinhala", key: "sinhala" },
  { label: "Tamil",   key: "tamil"   },
  { label: "English", key: "english" },
];

export default function ProfileTab({ form, onChange }: Props) {
  const set = (key: string, val: any) => onChange({ ...form, [key]: val });

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Profile Information</p>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 16, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", border: `3px solid ${C.purple}` }}>
          K
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Profile Photo</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>JPG or PNG, max 2MB</p>
        </div>
        <button style={{ marginLeft: "auto", background: "transparent", color: C.accent, border: `1px solid rgba(124,58,237,0.4)`, padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
          Upload Photo
        </button>
      </div>

      <SettingsField label="Full Name" value={form.name}     onChange={v => set("name", v)}     />
      <SettingsField label="Email"     value={form.email}    onChange={v => set("email", v)}    />
      <SettingsField label="Phone"     value={form.phone}    onChange={v => set("phone", v)}    />
      <SettingsField label="Location"  value={form.location} onChange={v => set("location", v)} />
      <SettingsField label="Bio"       value={form.bio}      onChange={v => set("bio", v)} type="textarea" />

      {/* Languages */}
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.6px" }}>
        Content Languages
      </p>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {LANGUAGES.map(l => (
          <label
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: (form as any)[l.key] ? C.purpleGlow : C.surface, border: `1px solid ${(form as any)[l.key] ? "rgba(124,58,237,0.4)" : C.border}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500, color: (form as any)[l.key] ? C.accent : C.subtle }}
          >
            <input
              type="checkbox"
              checked={(form as any)[l.key]}
              onChange={() => set(l.key, !(form as any)[l.key])}
              style={{ accentColor: C.purple }}
            />
            {l.label}
          </label>
        ))}
      </div>
    </div>
  );
}