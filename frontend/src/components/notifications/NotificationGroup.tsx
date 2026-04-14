import { Notification } from "./notificationData";
import NotificationItem from "./NotificationItem";

interface Props {
  group:      string;
  items:      Notification[];
  onMarkRead: (id: number) => void;
  onDelete:   (id: number) => void;
}

export default function NotificationGroup({ group, items, onMarkRead, onDelete }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{group}</div>
      {items.map(n => (
        <NotificationItem
          key={n.id}
          notification={n}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}