import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Trophy, FileText, Send, Settings, Hammer, Bookmark, ChevronRight, Users } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { getUserTeam, getMyOrders } from "../lib/api";

interface TeamStats {
  totalRegistered: number;
  total: number;
  active: number;
  inactive: number;
}

interface OrderStats {
  total: number;
  bought: number;
  sold: number;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { balance, user } = useBalance();
  const [teamStats, setTeamStats] = useState<TeamStats>({ totalRegistered: 0, total: 0, active: 0, inactive: 0 });
  const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, bought: 0, sold: 0 });

  const uid = user?.userId;

  useEffect(() => {
    if (!uid) return;
    getUserTeam(uid).then(({ team }) => {
      const total = team.length;
      const active = team.filter(m => (m.walletBalance ?? 0) > 0).length;
      const inactive = total - active;
      setTeamStats({ totalRegistered: total, total, active, inactive });
    }).catch(() => {});
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    getMyOrders(uid).then(orders => {
      const bought = orders.filter(o => o.status === 'bought').length;
      const sold = orders.filter(o => o.status === 'sold').length;
      setOrderStats({ total: orders.length, bought, sold });
    }).catch(() => {});
  }, [uid]);

  const reserveIncome   = user?.reserveIncome   ?? 0;
  const teamIncome      = user?.teamIncome       ?? 0;
  const activityIncome  = user?.activityIncome   ?? 0;
  const comprehensive   = reserveIncome + teamIncome + activityIncome;
  const totalIncome     = comprehensive;

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />

      {/* Wallet Balance Card — UID hidden */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)' }}>
        <p className="text-sm opacity-90">Wallet Balance (USDT)</p>
        <h1 className="text-3xl font-bold mt-1">${balance.toFixed(2)}</h1>
        <div className="flex items-center mt-2">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '6px 14px', boxShadow: '0 1px 3px rgba(30,58,138,0.12)' }}>
            <Trophy size={18} color="#1E293B" />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>Level {user?.level ?? 1}</span>
            <ChevronRight size={14} color="#1E293B" />
          </div>
        </div>
      </div>

      {/* ── Income Table ── */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">Daily Income</p>
          <p className="text-xs text-slate-500">
            Total Income: <span className="font-bold text-emerald-600">${totalIncome.toFixed(2)}</span>
          </p>
        </div>
        <div className="grid grid-cols-4 text-center divide-x divide-slate-100">
          {[
            { label: "Comprehensive", value: comprehensive, color: "#6366f1" },
            { label: "Reserve",       value: reserveIncome,  color: "#0ea5e9" },
            { label: "Team",          value: teamIncome,     color: "#10b981" },
            { label: "Activity",      value: activityIncome, color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} className="py-3 px-1">
              <p className="text-sm font-bold" style={{ color: item.color }}>${item.value.toFixed(2)}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Team */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">My Team</h3>
        <div className="grid grid-cols-4 text-center gap-2 mb-4">
          {[
            { val: teamStats.totalRegistered, label: "Total Register" },
            { val: teamStats.total,           label: "Total Members" },
            { val: teamStats.active,          label: "Active Members" },
            { val: teamStats.inactive,        label: "Inactive Members" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold text-slate-800">{item.val}</p>
              <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 text-center gap-2">
          <button onClick={() => setLocation('/team')} className="flex flex-col items-center gap-1">
            <Users className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">My Team</p>
          </button>
          <button onClick={() => setLocation('/team')} className="flex flex-col items-center gap-1">
            <Trophy className="text-yellow-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community</p>
          </button>
          <button onClick={() => setLocation('/assets')} className="flex flex-col items-center gap-1">
            <FileText className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">My Orders</p>
          </button>
        </div>
      </div>

      {/* My Orders */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">My Orders</h3>
          <button onClick={() => setLocation('/assets')} className="text-sm text-gray-400">View All &gt;</button>
        </div>
        <div className="grid grid-cols-3 text-center gap-2 mb-4">
          {[
            { val: orderStats.total,  label: 'Total' },
            { val: orderStats.bought, label: 'Bought' },
            { val: orderStats.sold,   label: 'Sold' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold" style={{ color: '#1E3A8A' }}>{item.val}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Functions */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">Common Functions</h2>
        <div className="border-t border-gray-100 my-3" />
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: Send,     cls: 'from-cyan-100 to-blue-100',     icCls: 'text-cyan-500',   label: 'Tutorials',  to: '/tutorials' },
            { icon: Settings, cls: 'from-blue-100 to-indigo-100',   icCls: 'text-blue-500',   label: 'Settings',   to: '/settings' },
            { icon: Hammer,   cls: 'from-teal-100 to-emerald-100',  icCls: 'text-teal-500',   label: 'Mint',       to: '/reserve' },
            { icon: Bookmark, cls: 'from-purple-100 to-pink-100',   icCls: 'text-purple-500', label: 'Collection', to: '/assets' },
          ].map(b => (
            <button key={b.label} onClick={() => setLocation(b.to)} className="flex flex-col items-center gap-2 py-2 active:bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 bg-gradient-to-br ${b.cls} rounded-xl flex items-center justify-center`}>
                <b.icon size={20} className={b.icCls} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-600">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
