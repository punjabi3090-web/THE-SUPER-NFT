import { useState } from "react";
import { Copy, Check, ChevronRight, Download, Upload, Clock, BookOpen, Shield, Settings, Headphones, Info, LogOut, Globe, History } from "lucide-react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE, useBalance } from "../App";

function QuickBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-1 py-3"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ background: '#EFF6FF' }}>
        {icon}
      </div>
      <span className="text-xs text-slate-600 font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-slate-50 text-left"
    >
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
  const { balance } = useBalance();
  const user = JSON.parse(localStorage.getItem('user') || 'null') || testUser;

  const handleCopyUID = () => {
    navigator.clipboard.writeText(testUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Profile Card */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {(user?.fullName || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.fullName || user?.name || 'Test User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-gray-500">UID: {testUser.uid}</p>
              <button onClick={handleCopyUID} style={{ color: '#1E3A8A' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#EFF6FF] rounded-xl p-3 border border-[#BFDBFE]">
          <p className="text-xs text-slate-500">Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)}</p>
        </div>
      </div>

      {/* ── 4 Quick-Action Buttons ─────────────────────────────────── */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm">
        <div className="flex divide-x divide-slate-100">
          <QuickBtn icon="💰" label="Deposit Record"    onClick={() => setLocation('/deposit-record')} />
          <QuickBtn icon="💸" label="Withdraw Record"   onClick={() => setLocation('/withdraw-record')} />
          <QuickBtn icon="🖼️" label="Reserve History"  onClick={() => setLocation('/reserve-history')} />
          <QuickBtn icon="📋" label="My History"        onClick={() => setLocation('/my-history')} />
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        <MenuItem icon={Shield}      label="Security"  onClick={() => setLocation('/security')} />
        <MenuItem icon={Settings}    label="Settings"  onClick={() => setLocation('/settings')} />
        <MenuItem icon={History}     label="My History" onClick={() => setLocation('/my-history')} />
        <MenuItem icon={Globe}       label="Language"  onClick={() => setLocation('/language')} />
        <MenuItem icon={Headphones}  label="Service"   onClick={() => setLocation('/service')} />
        <MenuItem icon={Info}        label="About"     onClick={() => { /* noop */ }} />
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
