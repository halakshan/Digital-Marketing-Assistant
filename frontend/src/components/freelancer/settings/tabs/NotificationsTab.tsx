"use client";

import { C }               from "@/components/freelancer/dashboard/dashboardData";
import { NotifForm }       from "../settingsData";
import SettingsNotifRow    from "../SettingsNotifRow";

interface Props {
  notifs:    NotifForm;
  onChange:  (n: NotifForm) => void;
}

const ROWS: { label: string; sub: string; key: keyof NotifForm }[] = [
  { label: "Messages",            sub: "Get notified when clients send you messages",     key: "messages"  },
  { label: "Payment Alerts",      sub: "Get notified about payments and withdrawals",     key: "payments"  },
  { label: "New Reviews",         sub: "Get notified when clients leave reviews",         key: "reviews"   },
  { label: "Marketing & Updates", sub: "Receive tips, features, and platform news",       key: "marketing" },
];

export default function NotificationsTab({ notifs, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Notification Preferences</p>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Choose what you want to be notified about</p>
      {ROWS.map(r => (
        <SettingsNotifRow
          key={r.key}
          label={r.label}
          sub={r.sub}
          val={notifs[r.key]}
          onToggle={() => onChange({ ...notifs, [r.key]: !notifs[r.key] })}
        />
      ))}
    </div>
  );
}