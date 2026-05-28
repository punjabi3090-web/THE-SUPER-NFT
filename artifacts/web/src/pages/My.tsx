import { useState } from "react";
import { Copy, Check, ChevronRight, Shield, FileText, Headphones, Info, LogOut, Download, Upload } from "lucide-react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE } from "../App";

export default function My() {
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
    window.location.href = '/login';
  };

  const menuItems = [
    { icon: Download, label: "Deposit Records", onClick: () => { console.log('deposit records'); setLocation('/deposit'); } },
    { icon: Upload, label: "Withdraw Records", onClick: () => { console.log('withdraw records'); setLocation('/withdraw'); } },
    { icon: FileText, label: "Bill Details", onClick: () => console.log('bill details') },
    { icon: Shield, label: "Security", onClick: () => console.log('security') },
    { icon: Headphones, label: "Service", onClick: () => console.log('service') },
    { icon: Info, label: "About", onClick: () => console.log('about') },
  ];

  return (
    <div className="pb-28 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Profile */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow">
            {(user?.fullName || user?.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{user?.fullName || user?.name || "Test User"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">UID: {testUser.uid}</span>
              <button onClick={handleCopyUID} className="text-blue-500">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-xl font-bold text-slate-800">${testUser.balance.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { console.log('deposit clicked'); setLocation('/deposit'); }}
              className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Deposit
            </button>
            <button
              onClick={() => { console.log('withdraw clicked'); setLocation('/withdraw'); }}
              className="bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 text-left"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <ChevronRight size={15} className="text-slate-300" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
        >
          <LogOut size={17} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
