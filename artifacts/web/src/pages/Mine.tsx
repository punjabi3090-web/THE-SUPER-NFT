import { useLocation } from "wouter";
import { Copy, Check, ArrowDownCircle, ArrowUpCircle, FileText, Shield, Headphones, Info, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE } from "../App";

export default function Mine() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null') || testUser;

  const handleCopyUID = () => {
    navigator.clipboard.writeText(testUser.uid);
    console.log('uid copied', testUser.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    console.log('logout clicked');
    localStorage.clear();
    setLocation('/login');
  };

  const menuItems = [
    { icon: ArrowDownCircle, label: "Deposit Records", color: "text-emerald-500", onClick: () => { console.log('deposit records'); setLocation('/deposit'); } },
    { icon: ArrowUpCircle, label: "Withdraw Records", color: "text-blue-500", onClick: () => { console.log('withdraw records'); setLocation('/withdraw'); } },
    { icon: FileText, label: "Bill Details", color: "text-purple-500", onClick: () => console.log('bill details') },
    { icon: Shield, label: "Security", color: "text-orange-500", onClick: () => console.log('security') },
    { icon: Headphones, label: "Service", color: "text-pink-500", onClick: () => console.log('service') },
    { icon: Info, label: "About", color: "text-slate-500", onClick: () => console.log('about') },
  ];

  return (
    <div className="min-h-screen pb-20" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {(user?.fullName || user?.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{user?.fullName || user?.name || "Test User"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">UID: {testUser.uid}</span>
              <button onClick={handleCopyUID} className="text-emerald-500">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-2xl p-4 text-white shadow-md mb-1" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
          <p className="text-sm opacity-80 mb-1">Total Balance</p>
          <p className="text-2xl font-bold mb-3">${testUser.balance.toFixed(2)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { console.log('deposit clicked'); setLocation('/deposit'); }}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1"
            >
              <ArrowDownCircle size={15} /> Deposit
            </button>
            <button
              onClick={() => { console.log('withdraw clicked'); setLocation('/withdraw'); }}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1"
            >
              <ArrowUpCircle size={15} /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={item.color} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mx-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
