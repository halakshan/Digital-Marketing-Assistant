"use client";

import { C }            from "@/components/freelancer/dashboard/dashboardData";
import { PrivacyForm }  from "../settingsData";
import SettingsNotifRow from "../SettingsNotifRow";

interface Props {
  privacy:  PrivacyForm;
  onChange: (p: PrivacyForm) => void;
}

const ROWS: { label: string; sub: string; key: keyof PrivacyForm }[] = [
  { label: "Public Profile", sub: "Allow clients to find and view your profile", key: "profilePublic" },
  { label: "Show Earnings",  sub: "Display your total earnings on your profile", key: "showEarnings"  },
  { label: "Show Location",  sub: "Display your city on your public profile",    key: "showLocation"  },
];

export default function PrivacyTab({ privacy, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Privacy Settings</p>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Control what others can see on your profile</p>
      {ROWS.map(r => (
        <SettingsNotifRow
          key={r.key}
          label={r.label}
          sub={r.sub}
          val={privacy[r.key]}
          onToggle={() => onChange({ ...privacy, [r.key]: !privacy[r.key] })}
        />
      ))}
    </div>
  );
}