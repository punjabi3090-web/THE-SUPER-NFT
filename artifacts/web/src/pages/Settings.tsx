import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

type UserProfile = {
  fullName?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  referralCode?: string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-[#1E293B]">{value || '—'}</span>
    </div>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();

  const user: UserProfile = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-[#1E293B]">Account Settings</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mt-8 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
          {(user.fullName || user.name || 'U')[0].toUpperCase()}
        </div>
        <p className="mt-3 font-bold text-[#1E293B] text-lg">{user.fullName || user.name || 'User'}</p>
        <p className="text-sm text-slate-400">@{user.username || 'unknown'}</p>
      </div>

      {/* Profile Card — read only */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden px-4">
        <InfoRow label="Full Name"     value={user.fullName || user.name || ''} />
        <InfoRow label="Username"      value={user.username || ''} />
        <InfoRow label="Email"         value={user.email || ''} />
        <InfoRow label="Phone"         value={`${user.countryCode || ''} ${user.phone || ''}`.trim()} />
        <InfoRow label="Country"       value={user.country || user.countryCode || ''} />
        <InfoRow label="Referral Code" value={user.referralCode || '—'} />
      </div>

      <div className="mx-4 mt-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
        <p className="text-xs text-[#1E3A8A] font-medium">
          Profile details are read-only. Contact support to update your information.
        </p>
      </div>
    </div>
  );
}
