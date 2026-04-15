"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const TABS = [
  { key: "profile",       label: "👤 Profile"       },
  { key: "business",      label: "🏢 Business"      },
  { key: "notifications", label: "🔔 Notifications" },
  { key: "billing",       label: "💳 Billing"       },
  { key: "security",      label: "🔒 Security"      },
];

interface Props {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

export default function SettingsNav({ activeTab, setActiveTab }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="w-48 flex-shrink-0 space-y-1">
      {TABS.map(t => (
        <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            activeTab === t.key
              ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/15 text-white border border-violet-500/30"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}>{t.label}</button>
      ))}

      <div className="pt-4 border-t border-white/10 mt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border hover:border-red-500/20 transition-all">
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
