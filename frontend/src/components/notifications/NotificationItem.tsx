import Link from "next/link";
import { Notification } from "./notificationData";

interface Props {
  notification: Notification;
  onMarkRead:   (id: number) => void;
  onDelete:     (id: number) => void;
}

export default function NotificationItem({ notification: n, onMarkRead, onDelete }: Props) {
  return (
    <div className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all hover:bg-white/[0.04] ${
      !n.read ? "bg-white/[0.03] border-white/15" : "bg-transparent border-white/5"
    }`}>

      {/* Unread dot */}
      {!n.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl ${n.bg} border ${n.border} flex items-center justify-center text-xl flex-shrink-0`}>
        {n.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className={`text-sm font-bold ${!n.read ? "text-white" : "text-gray-300"}`}>
            {n.title}
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{n.time}</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{n.desc}</p>
        <div className="flex items-center gap-3">
          <Link href={n.href} onClick={() => onMarkRead(n.id)}
            className={`text-xs font-semibold ${n.color} hover:opacity-80 transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg`}>
            {n.action} →
          </Link>
          {!n.read && (
            <button type="button" onClick={() => onMarkRead(n.id)}
              className="text-xs text-gray-500 hover:text-white transition-colors">
              Mark as read
            </button>
          )}
          <button type="button" onClick={() => onDelete(n.id)}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-auto">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}