import Toggle from "./Toggle";

const NOTIF_ITEMS = [
  { key: "aiContent",   label: "AI Content Alerts",    desc: "When AI content is generated"             },
  { key: "campaigns",   label: "Campaign Updates",      desc: "Email campaign delivery and stats"         },
  { key: "freelancer",  label: "Freelancer Activity",   desc: "Bids, messages, and project updates"       },
  { key: "seo",         label: "SEO Alerts",            desc: "New SEO issues detected on your site"      },
  { key: "payments",    label: "Payment Notifications", desc: "Invoices, receipts, and billing"           },
  { key: "system",      label: "System Notifications",  desc: "App updates, maintenance, new features"    },
  { key: "emailDigest", label: "Weekly Email Digest",   desc: "Summary of your weekly activity via email" },
  { key: "marketing",   label: "Marketing Emails",      desc: "Tips, updates and promotional emails"      },
];

type NotifKeys = "aiContent"|"campaigns"|"freelancer"|"seo"|"payments"|"system"|"emailDigest"|"marketing";

interface Props {
  notifs: Record<NotifKeys, boolean>;
  onToggle: (key: NotifKeys) => void;
  onSave: () => void;
}

export default function NotificationsTab({ notifs, onToggle, onSave }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="text-base font-bold mb-2">Notification Preferences</h3>
      {NOTIF_ITEMS.map(item => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
          <div>
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="text-xs text-gray-400">{item.desc}</div>
          </div>
          <Toggle enabled={notifs[item.key as NotifKeys]} onChange={() => onToggle(item.key as NotifKeys)} />
        </div>
      ))}
      <button type="button" onClick={onSave}
        className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
        Save Preferences
      </button>
    </div>
  );
}