import { useState, useEffect } from "react";
import { LogOut, User, Wallet, TrendingUp, ArrowUpRight, Copy, Check, Shield, Bell, Users, Coins } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    const link = `${window.location.origin}/signup?ref=${profile?.referral_code ?? ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || authEmail.split('@')[0] || 'User';
  const initial     = displayName[0].toUpperCase();
  const refLink     = `${window.location.origin}/signup?ref=${profile?.referral_code ?? ''}`;
  const balance     = profile?.balance ?? 0;
  const earned      = profile?.total_earned ?? 0;
  const withdrawn   = profile?.total_withdrawn ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-10 max-w-md mx-auto">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-10 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-lg select-none"
            style={{ background: 'linear-gradient(135deg,#1E3A8A,#7C3AED)' }}
          >
            {initial}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">{displayName}</p>
            <p className="text-[11px] text-slate-400">Level {profile?.level ?? 1} Member</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-red-500 text-xs font-semibold hover:text-red-600 transition-colors"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── Balance Card ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#7C3AED 100%)' }}
        >
          <div className="flex items-center gap-2 opacity-75 mb-1">
            <Wallet size={14} />
            <p className="text-xs font-medium">Wallet Balance</p>
          </div>
          <p className="text-4xl font-extrabold tracking-tight">${balance.toFixed(2)}</p>
          <p className="text-xs opacity-50 mt-0.5">USDT</p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => window.location.replace('/deposit')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-all active:scale-95"
            >
              + Deposit
            </button>
            <button
              onClick={() => window.location.replace('/withdraw')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-all active:scale-95"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-emerald-500" />
              <p className="text-[11px] text-slate-400 font-medium">Total Earned</p>
            </div>
            <p className="text-xl font-extrabold text-emerald-600">${earned.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight size={14} className="text-blue-500" />
              <p className="text-[11px] text-slate-400 font-medium">Total Withdrawn</p>
            </div>
            <p className="text-xl font-extrabold text-blue-600">${withdrawn.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Profile Info ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[#1E3A8A]" />
            <p className="font-semibold text-slate-800 text-sm">Profile Information</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: "Full Name",      value: profile?.full_name },
              { label: "Email",          value: profile?.email || authEmail },
              { label: "Phone",          value: profile?.phone },
              { label: "Country",        value: profile?.country },
              { label: "User ID",        value: profile?.user_id },
              { label: "Referral Code",  value: profile?.referral_code },
              { label: "Level",          value: profile?.level != null ? `Level ${profile.level}` : null },
              { label: "Member Since",   value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5">
                <p className="text-xs text-slate-400">{row.label}</p>
                <p className="text-sm font-medium text-slate-800 text-right max-w-[60%] truncate">
                  {row.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Referral Link ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-[#1E3A8A]" />
            <p className="font-semibold text-slate-800 text-sm">My Referral Link</p>
          </div>
          <div className="flex items-center gap-2 bg-[#EFF6FF] rounded-xl px-3 py-2.5 border border-[#BFDBFE]">
            <p className="text-xs text-slate-600 font-mono flex-1 truncate">{refLink}</p>
            <button onClick={handleCopy} className="text-[#1E3A8A] flex-shrink-0 p-1">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-600 mt-2 text-center font-medium">✓ Copied to clipboard!</p>}
        </div>

        {/* ── Quick Links ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "💰", label: "Deposit",       path: "/deposit-record" },
            { emoji: "💸", label: "Withdraw",      path: "/withdraw-record" },
            { emoji: "📋", label: "History",       path: "/my-history" },
            { emoji: "👥", label: "My Team",       path: "/team" },
            { emoji: "🖼️", label: "NFT Shop",     path: "/showcase" },
            { emoji: "🔔", label: "Alerts",        path: "/notifications" },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => window.location.replace(item.path)}
              className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-1.5 hover:border-purple-200 transition-colors active:scale-95"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── Nav Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Coins,  label: "Reserve",  path: "/reserve" },
            { icon: Coins,  label: "Stake",    path: "/stake" },
            { icon: Shield, label: "Security", path: "/security" },
            { icon: Bell,   label: "Service",  path: "/service" },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => window.location.replace(item.path)}
              className="bg-white rounded-2xl py-3 px-1 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-1.5 hover:border-purple-200 transition-colors active:scale-95"
            >
              <item.icon size={18} className="text-[#1E3A8A]" />
              <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
