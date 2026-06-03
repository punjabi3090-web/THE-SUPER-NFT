import { useState } from "react";
import { useLocation } from "wouter";
import { User, Mail, Phone, MapPin, Tag, ArrowLeft, Copy, Check } from "lucide-react";
import { useBalance } from "../App";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user } = useBalance();
  const [copied, setCopied] = useState(false);

  const fields = [
    { icon: User, label: "Full Name", value: user?.name || "—" },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    { icon: Phone, label: "Phone", value: user?.phone || "—" },
    { icon: MapPin, label: "Country", value: user?.country || "—" },
    { icon: Tag, label: "User ID", value: user?.userId || "—" },
  ];

  const copyRef = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Account Settings</h2>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg,#1E3A8A,#7C3AED)' }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400">Level {user?.level?? 1} Member</p>
            <p className="text-xs text-slate-400">Joined {user?.joinDate? new Date(user.joinDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {fields.map(f => (
          <div key={f.label} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
            <f.icon size={18} className="text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">{f.label}</p>
              <p className="text-sm font-medium text-slate-800 truncate">{f.value}</p>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
          <Tag size={18} className="text-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-slate-400">My Referral Code</p>
            <p className="text-sm font-bold text-blue-600">{user?.referralCode || '—'}</p>
          </div>
          <button onClick={copyRef} style={{ color: '#1E3A8A' }}>
            {copied? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {user?.referralCode && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#1E3A8A] mb-1">Share Your Referral Link</p>
            <p className="text-xs text-slate-600 font-mono break-all">
              {window.location.origin}/login?ref={user.referralCode}
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center py-2">Profile information is read-only. Contact support to make changes.</p>
      </div>
    </div>
  );
}