import { ArrowLeft, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { notifications, unreadCount, markNotificationRead, markAllRead, user } = useBalance();
  const userId = user?.userId ?? '';

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 pb-10">
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/')} className="text-slate-700"><ArrowLeft size={22} /></button>
          <h2 className="font-bold text-lg text-slate-800">Announcements</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1E3A8A' }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📣</p>
            <p className="text-slate-500 font-medium">No announcements yet</p>
            <p className="text-xs text-slate-400 mt-1">Admin announcements will appear here</p>
          </div>
        ) : notifications.map(n => {
          const isUnread = userId && !n.read.includes(userId);
          return (
            <button key={n.id} onClick={() => { if (userId) markNotificationRead(n.id); }}
              className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border-l-4 ${isUnread ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">📣</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                    {isUnread && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#1E3A8A' }} />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(n.date).toLocaleString()}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
