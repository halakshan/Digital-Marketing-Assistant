import { CATEGORY_FILTERS, Notification } from "./notificationData";

interface Props {
  activeFilter:    string;
  setActiveFilter: (val: string) => void;
  notifications:   Notification[];
}

export default function NotificationFilters({ activeFilter, setActiveFilter, notifications }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORY_FILTERS.map(f => {
        const count = notifications.filter(
          n => (f.key === "all" || n.category === f.key) && !n.read
        ).length;
        return (
          <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeFilter === f.key
                ? "bg-red-600/20 border-red-500/40 text-red-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-white"
            }`}>
            <span>{f.icon}</span>
            <span>{f.label}</span>
            {count > 0 && (
              <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}