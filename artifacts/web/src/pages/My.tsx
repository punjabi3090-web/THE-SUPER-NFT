import { useState } from "react";
import { Copy, Check, ChevronRight, Shield, Settings, Headphones, Info, LogOut, Globe, History } from "lucide-react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { logoutUser } from "../lib/api";

function QuickBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 py-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: '#EFF6FF' }}>{icon}</div>
      <span className="text-xs text-slate-600 font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-slate-50 text-left">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gray-500" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </button>
  );
}

export default function My() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { balance, user } = useBalance();

  const uid6 = String(user?.userId || 0).padStart(6, '0');

  const handleCopyUID = () => {
    navigator.clipboard.writeText(uid6);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/login';
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />

      {/* Profile Card */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg,#1E3A8A,#7C3AED)' }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-400">UID:</span>
              <span className="text-xs font-mono font-bold text-[#1E3A8A]">{uid6}</span>
              <button onClick={handleCopyUID} className="text-slate-400 hover:text-blue-600 transition-colors ml-0.5">
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
              {copied && <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Level</p>
            <p className="text-lg font-bold text-[#1E3A8A]">{user?.level ?? 1}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-emerald-600">${balance.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Balance</p>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-blue-600">${user?.totalDeposit?.toFixed(2) ?? '0.00'}</p>
            <p className="text-[10px] text-slate-400">Total Deposit</p>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-red-500">${user?.totalWithdraw?.toFixed(2) ?? '0.00'}</p>
            <p className="text-[10px] text-slate-400">Withdrawn</p>
          </div>
        </div>
      </div>

      {/* 5 Quick Buttons */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm">
        <div className="flex divide-x divide-slate-100">
          <QuickBtn icon="💰" label="Deposit"    onClick={() => setLocation('/deposit-record')} />
          <QuickBtn icon="💸" label="Withdraw"   onClick={() => setLocation('/withdraw-record')} />
          <QuickBtn icon="👥" label="My Team"    onClick={() => setLocation('/team')} />
          <QuickBtn icon="🖼️" label="Reserve"   onClick={() => setLocation('/reserve-history')} />
          <QuickBtn icon="📋" label="History"    onClick={() => setLocation('/my-history')} />
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        <MenuItem icon={Shield}     label="Security"    onClick={() => setLocation('/security')} />
        <MenuItem icon={Settings}   label="Settings"    onClick={() => setLocation('/settings')} />
        <MenuItem icon={History}    label="My History"  onClick={() => setLocation('/my-history')} />
        <MenuItem icon={Globe}      label="Language"    onClick={() => setLocation('/language')} />
        <MenuItem icon={Headphones} label="Service"     onClick={() => setLocation('/service')} />
        <MenuItem icon={Info}       label="About"       onClick={() => {}} />
      </div>

      <div className="mx-4 mt-4">
        <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
