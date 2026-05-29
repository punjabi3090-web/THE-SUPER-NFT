import { useLocation } from "wouter";
import { Users, Trophy, FileText, Share2, User, FileCheck, Send, Settings, Hammer, Bookmark, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";

export default function Home() {
  const [, setLocation] = useLocation();
  const { balance, user } = useBalance();
  const [copied, setCopied] = useState(false);

  const copyRef = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/login?ref=${user.referralCode}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />

      {/* Wallet Balance Card */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)' }}>
        <p className="text-sm opacity-90">Wallet Balance (USDT)</p>
        <h1 className="text-3xl font-bold mt-1">${balance.toFixed(2)}</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '6px 14px', boxShadow: '0 1px 3px rgba(30,58,138,0.12)', marginTop: 8 }}>
          <Trophy size={18} color="#1E293B" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>Level {user?.level ?? 1}</span>
          <ChevronRight size={14} color="#1E293B" />
        </div>
      </div>

      {/* My Team */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">My Team</h3>
        <div className="grid grid-cols-4 text-center gap-2 mb-4">
          {[
            { val: '0', label: "Community rewards" },
            { val: '0', label: "Valid Members" },
            { val: '0', label: "A enthusiast" },
            { val: '0', label: "B+C enthusiasts" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold text-slate-800">{item.val}</p>
              <p className="text-gray-400 text-xs leading-tight mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 text-center gap-2">
          <button className="flex flex-col items-center gap-1">
            <Users className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community enthusiasts</p>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Trophy className="text-yellow-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community contributions</p>
          </button>
          <button className="flex flex-col items-center gap-1">
            <FileText className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community orders</p>
          </button>
          <button onClick={copyRef} className="flex flex-col items-center gap-1">
            {copied ? <Check className="text-emerald-400" size={24} /> : <Share2 className="text-slate-400" size={24} />}
            <p className="text-xs text-gray-500 leading-tight">Referral</p>
          </button>
        </div>
      </div>

      {/* Referral code highlight */}
      {user?.referralCode && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-[#BFDBFE] rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Your Referral Code</p>
            <p className="font-bold text-[#1E3A8A]">{user.referralCode}</p>
          </div>
          <button onClick={copyRef} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white" style={{ background: '#1E3A8A' }}>
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
          </button>
        </div>
      )}

      {/* My Orders */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">My Orders</h3>
          <button className="text-sm text-gray-400">Check Orders &gt;</button>
        </div>
        <div className="grid grid-cols-3 text-center gap-2 mb-4">
          {[{ val: 0, label: 'Total' }, { val: 0, label: 'Bought' }, { val: 0, label: 'Sold' }].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold" style={{ color: '#1E3A8A' }}>{item.val}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 text-center gap-2">
          <button className="flex flex-col items-center gap-1"><User className="text-blue-400" size={24} /><p className="text-xs text-gray-500">My Bid</p></button>
          <button className="flex flex-col items-center gap-1"><FileCheck className="text-blue-400" size={24} /><p className="text-xs text-gray-500">Details</p></button>
        </div>
      </div>

      {/* Common Functions */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">Common Functions</h2>
        <div className="border-t border-gray-100 my-3" />
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: Send,     cls: 'from-cyan-100 to-blue-100',     icCls: 'text-cyan-500',   label: 'Tutorials', to: '/tutorials' },
            { icon: Settings, cls: 'from-blue-100 to-indigo-100',   icCls: 'text-blue-500',   label: 'Settings',  to: '/settings' },
            { icon: Hammer,   cls: 'from-teal-100 to-emerald-100',  icCls: 'text-teal-500',   label: 'Mint',      to: '/reserve' },
            { icon: Bookmark, cls: 'from-purple-100 to-pink-100',   icCls: 'text-purple-500', label: 'Collection',to: '/assets' },
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
