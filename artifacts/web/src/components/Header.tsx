import { useState, useRef, useEffect } from "react";
import { Bell, Menu, Globe, Send, Headphones, X, CheckCheck, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

const LOGO_TAPS = 5;
const TAP_WINDOW = 2000;

export default function Header() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [, setLocation]           = useLocation();
  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const tapTimes = useRef<number[]>([]);

  const { notifications, unreadCount, markNotificationRead, markAllRead, user } = useBalance();
  const userId = user?.userId ?? '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogoTap = () => {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter(t => now - t < TAP_WINDOW), now];
    if (tapTimes.current.length >= LOGO_TAPS) { tapTimes.current = []; setLocation('/admin'); }
  };

  const menuItems = [
    { icon: Globe,      label: "Language", color: "text-blue-500",    action: () => { setLocation('/language'); setMenuOpen(false); } },
    { icon: Send,       label: "Telegram", color: "text-cyan-500",    action: () => { window.open('https://t.me/thesupernft', '_blank'); setMenuOpen(false); } },
    { icon: Headphones, label: "Service",  color: "text-emerald-500", action: () => { setLocation('/service'); setMenuOpen(false); } },
  ];

  return (
    <div className="bg-white px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <button className="flex items-center gap-2 select-none" onClick={handleLogoTap}>
        <img src="/images/logo.png" alt="The Super NFT" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
        <span className="font-bold text-lg text-slate-800">THE SUPER NFT</span>
      </button>

      <div className="flex items-center gap-3 text-slate-600">

        {/* Bell — admin announcements */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }} className="relative p-1">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="font-bold text-slate-800 text-sm">
                  Announcements{unreadCount > 0 && <span className="ml-1" style={{ color: '#1E3A8A' }}>({unreadCount} new)</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#1E3A8A' }}>
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-2xl mb-1">📣</p>
                    <p className="text-xs">No announcements yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => {
                    const isUnread = userId && !n.read.includes(userId);
                    return (
                      <button key={n.id} onClick={() => { if (userId) markNotificationRead(n.id); }}
                        className={`w-full text-left px-4 py-3 flex gap-3 items-start border-b border-slate-50 hover:bg-slate-50 transition-colors ${isUnread ? 'bg-blue-50/60' : ''}`}
                      >
                        <span className="text-base leading-none mt-0.5 shrink-0">📣</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">{new Date(n.date).toLocaleString()}</p>
                        </div>
                        {isUnread && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#1E3A8A' }} />}
                      </button>
                    );
                  })
                )}
              </div>

              <button onClick={() => { setNotifOpen(false); setLocation('/notifications'); }}
                className="w-full py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border-t border-slate-100 text-center" style={{ color: '#1E3A8A' }}>
                View all announcements →
              </button>
            </div>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }} className={`p-1 rounded-lg transition-colors ${menuOpen ? 'bg-slate-100' : ''}`}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-44 z-50">
              {menuItems.map((item, i) => (
                <button key={i} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                  <item.icon size={18} className={item.color} />
                  <span className="text-sm font-medium text-slate-700 flex-1">{item.label}</span>
                  <ChevronRight size={13} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
