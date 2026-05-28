import { ArrowLeft, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

const NOTIF_ICON: Record<string, string> = {
  deposit: '💰', withdraw: '⬆️', order: '🖼️', stake: '📈', admin: '🛡️', security: '🔐'
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { notifications, markNotificationRead, markAllRead } = useBalance();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/')} className="text-slate-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">
            Notifications {unread > 0 && <span className="text-emerald-500 text-base">({unread})</span>}
          </h1>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="pb-8">
        {notifications.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-5xl mb-4">🔔</p>
            <p className="font-semibold text-slate-500 mb-1">No notifications yet</p>
            <p className="text-sm">Activity from deposits, stakes and orders will appear here</p>
          </div>
        ) : (
          <div>
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`w-full text-left px-4 py-4 flex gap-4 items-start border-b border-slate-100 transition-colors ${
                  !n.read ? 'bg-emerald-50/60' : 'bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  !n.read ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {NOTIF_ICON[n.type] ?? '📣'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                  <p className="text-xs text-slate-300 mt-1">{new Date(n.date).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
