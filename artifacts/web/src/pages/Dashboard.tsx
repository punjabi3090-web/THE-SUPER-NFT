import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { LogOut, Copy, Check, User, DollarSign, TrendingUp, ArrowUpRight, Users, Shield } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  user_id: string | null;
  referral_code: string | null;
  level: number | null;
  balance: number | null;
  total_earned: number | null;
  total_withdrawn: number | null;
  created_at: string | null;
};

export default function Dashboard() {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        window.location.replace('/login');
        return;
      }
      setAuthEmail(user.email ?? "");
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/login?ref=${profile?.referral_code ?? ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || authEmail.split('@')[0] || 'User';
  const initial     = displayName[0].toUpperCase();
  const balance     = profile?.balance ?? 0;
  const earned      = profile?.total_earned ?? 0;
  const withdrawn   = profile?.total_withdrawn ?? 0;
  const refLink     = `${window.location.origin}/login?ref=${profile?.referral_code ?? ''}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      <div className="max-w-md mx-auto px-4">

        {/* ── Header ─── */}
        <div className="flex items-center justify-between pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-lg"
              style={{ background: 'linear-gradient(135deg, #6b21a8, #4f46e5)' }}
            >
              {initial}
            </div>
            <div>
              <p className="font-bold text-white">{displayName}</p>
              <p className="text-xs text-slate-400">Level {profile?.level ?? 1}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* ── Balance Card ─── */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' }}
        >
          <div className="flex items-center gap-2 mb-1 opacity-75">
            <DollarSign size={14} />
            <p className="text-xs font-medium">Wallet Balance</p>
          </div>
          <p className="text-4xl font-extrabold">${balance.toFixed(2)}</p>
          <p className="text-xs opacity-50 mt-1">USDT</p>
        </div>

        {/* ── Stats ─── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-xs text-slate-400">Total Earned</p>
            </div>
            <p className="text-xl font-extrabold text-emerald-400">${earned.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight size={14} className="text-blue-400" />
              <p className="text-xs text-slate-400">Withdrawn</p>
            </div>
            <p className="text-xl font-extrabold text-blue-400">${withdrawn.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Profile Info ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-purple-400" />
            <p className="font-semibold text-white text-sm">Profile Information</p>
          </div>
          <div className="divide-y divide-slate-700">
            {[
              { label: "Full Name",     value: profile?.full_name },
              { label: "Email",         value: profile?.email || authEmail },
              { label: "Phone",         value: profile?.phone },
              { label: "Country",       value: profile?.country },
              { label: "User ID",       value: profile?.user_id },
              { label: "Referral Code", value: profile?.referral_code },
              { label: "Level",         value: profile?.level != null ? `Level ${profile.level}` : null },
              { label: "Member Since",  value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5">
                <p className="text-xs text-slate-400">{row.label}</p>
                <p className="text-sm font-medium text-white text-right max-w-[55%] truncate">
                  {row.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Referral Link ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-purple-400" />
            <p className="font-semibold text-white text-sm">My Referral Link</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-2.5">
            <p className="text-xs text-slate-300 font-mono flex-1 truncate">{refLink}</p>
            <button onClick={handleCopy} className="text-purple-400 flex-shrink-0 p-1 hover:text-purple-300">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-400 mt-2 text-center font-medium">✓ Copied!</p>}
        </div>

        {/* ── Quick Links ─── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "🖼️", label: "NFT Collections", action: () => {} },
            { emoji: "💰", label: "Deposit",          action: () => {} },
            { emoji: "💸", label: "Withdraw",         action: () => {} },
            { emoji: "👥", label: "My Team",          action: () => {} },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-colors"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-slate-300 font-medium">{item.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
