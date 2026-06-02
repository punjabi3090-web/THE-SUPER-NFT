import { useState, useEffect } from "react";
import { Home, Bookmark, Coins, Wallet, User, Copy, Check, Link, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useBalance } from "../App";

// ── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "home" | "reserve" | "stake" | "asset" | "profile";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1 min-w-0">
      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab() {
  const { balance, user } = useBalance();
  const total = (user?.reserveIncome ?? 0) + (user?.teamIncome ?? 0) + (user?.activityIncome ?? 0);
  return (
    <div className="px-4 space-y-4">
      {/* Balance Card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#1E3A8A,#7C3AED)" }}>
        <p className="text-xs opacity-75 mb-1">Wallet Balance</p>
        <p className="text-3xl font-extrabold">${balance.toFixed(2)}</p>
        <p className="text-xs opacity-60 mt-1">USDT</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { window.location.replace('/deposit'); }} className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur text-white">
            + Deposit
          </button>
          <button onClick={() => { window.location.replace('/withdraw'); }} className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur text-white">
            Withdraw
          </button>
        </div>
      </div>

      {/* Income Stats */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Income Overview</p>
      <div className="flex gap-3">
        <StatCard label="Reserve" value={`$${(user?.reserveIncome ?? 0).toFixed(2)}`} color="text-emerald-600" />
        <StatCard label="Team" value={`$${(user?.teamIncome ?? 0).toFixed(2)}`} color="text-blue-600" />
        <StatCard label="Activity" value={`$${(user?.activityIncome ?? 0).toFixed(2)}`} color="text-purple-600" />
      </div>

      {/* Total */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
        <p className="text-sm text-slate-500">Total Earned</p>
        <p className="text-lg font-extrabold text-emerald-600">${total.toFixed(2)}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: "💰", label: "Deposit Record", path: "/deposit-record" },
          { emoji: "💸", label: "Withdraw Record", path: "/withdraw-record" },
          { emoji: "📋", label: "My History", path: "/my-history" },
          { emoji: "👥", label: "My Team", path: "/team" },
          { emoji: "🖼️", label: "Reserve History", path: "/reserve-history" },
          { emoji: "🔔", label: "Notifications", path: "/notifications" },
        ].map(item => (
          <button key={item.path} onClick={() => { window.location.replace(item.path); }}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-1.5">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Reserve Tab ───────────────────────────────────────────────────────────────
function ReserveTab() {
  return (
    <div className="px-4 flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="text-6xl">🖼️</div>
      <p className="text-lg font-bold text-slate-700">NFT Reserve</p>
      <p className="text-sm text-slate-400 text-center">Reserve exclusive NFTs and earn daily income from your investments.</p>
      <button onClick={() => { window.location.replace('/reserve'); }}
        className="px-8 py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-purple-600 to-cyan-600">
        Go to Reserve →
      </button>
      <button onClick={() => { window.location.replace('/reserve-history'); }}
        className="px-8 py-2 rounded-2xl font-semibold text-slate-500 text-xs border border-slate-200">
        View Reserve History
      </button>
    </div>
  );
}

// ── Stake Tab ─────────────────────────────────────────────────────────────────
function StakeTab() {
  return (
    <div className="px-4 flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="text-6xl">🪙</div>
      <p className="text-lg font-bold text-slate-700">Staking</p>
      <p className="text-sm text-slate-400 text-center">Stake your assets to earn passive rewards and grow your portfolio.</p>
      <button onClick={() => { window.location.replace('/stake'); }}
        className="px-8 py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-purple-600">
        Go to Stake →
      </button>
    </div>
  );
}

// ── Asset Tab ─────────────────────────────────────────────────────────────────
function AssetTab() {
  const { user, balance } = useBalance();
  return (
    <div className="px-4 space-y-4">
      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }}>
        <p className="text-xs opacity-75 mb-1">Total Balance</p>
        <p className="text-3xl font-extrabold">${balance.toFixed(2)}</p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs opacity-60">Deposited</p>
            <p className="text-sm font-bold">${(user?.totalDeposit ?? 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs opacity-60">Withdrawn</p>
            <p className="text-sm font-bold">${(user?.totalWithdraw ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { window.location.replace('/deposit'); }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-xs font-bold text-slate-600">Deposit</p>
        </button>
        <button onClick={() => { window.location.replace('/withdraw'); }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl mb-1">💸</p>
          <p className="text-xs font-bold text-slate-600">Withdraw</p>
        </button>
        <button onClick={() => { window.location.replace('/assets'); }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl mb-1">📊</p>
          <p className="text-xs font-bold text-slate-600">All Assets</p>
        </button>
        <button onClick={() => { window.location.replace('/my-history'); }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-xs font-bold text-slate-600">History</p>
        </button>
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ onAvatarClick }: { onAvatarClick: () => void }) {
  const { user, balance } = useBalance();
  const [copiedRef, setCopiedRef] = useState(false);

  const phoneDigits = (user?.phone || '').replace(/\D/g, '');
  const uid6 = phoneDigits.length >= 6
    ? phoneDigits.slice(-6).padStart(6, '0')
    : String(user?.userId || 0).padStart(6, '0');

  const referralLink = `${window.location.origin}/login?ref=${uid6}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="px-4 space-y-4">
      {/* Avatar + Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar — 5 clicks → admin */}
          <button onClick={onAvatarClick}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl select-none flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#1E3A8A,#7C3AED)" }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </button>
          <div>
            <p className="font-bold text-slate-800 text-base">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email || ''}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400">UID:</span>
              <span className="text-xs font-mono font-bold text-[#1E3A8A]">{uid6}</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Level</p>
            <p className="text-xl font-extrabold text-[#1E3A8A]">{user?.level ?? 1}</p>
          </div>
        </div>
        {/* Balance row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-emerald-600">${balance.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Balance</p>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-blue-600">${(user?.totalDeposit ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Deposited</p>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-2.5 text-center border border-[#BFDBFE]">
            <p className="text-sm font-bold text-red-500">${(user?.totalWithdraw ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Withdrawn</p>
          </div>
        </div>
      </div>

      {/* Quick menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {[
          { emoji: "🔒", label: "Security", path: "/security" },
          { emoji: "⚙️", label: "Settings", path: "/settings" },
          { emoji: "👥", label: "My Team", path: "/team" },
          { emoji: "🌐", label: "Language", path: "/language" },
          { emoji: "🎧", label: "Support", path: "/service" },
        ].map((item, i, arr) => (
          <button key={item.path} onClick={() => { window.location.replace(item.path); }}
            className={`flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-slate-50 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-base">{item.emoji}</span>
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
            <span className="text-slate-300 text-xs">›</span>
          </button>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Link size={15} className="text-[#1E3A8A]" />
          <p className="text-sm font-semibold text-slate-700">My Referral Link</p>
        </div>
        <div className="flex items-center gap-2 bg-[#EFF6FF] rounded-xl px-3 py-2 border border-[#BFDBFE]">
          <span className="flex-1 text-xs text-slate-600 font-mono truncate">{referralLink}</span>
          <button onClick={handleCopyRef}
            className="flex items-center gap-1 bg-[#1E3A8A] text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">
            {copiedRef ? <Check size={12} /> : <Copy size={12} />}
            {copiedRef ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full bg-red-500 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md">
        <LogOut size={18} /> Logout
      </button>

      <div className="h-4" />
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "home",    icon: Home,     label: "Home" },
  { id: "reserve", icon: Bookmark, label: "Reserve" },
  { id: "stake",   icon: Coins,    label: "Stake" },
  { id: "asset",   icon: Wallet,   label: "Asset" },
  { id: "profile", icon: User,     label: "Profile" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [clickCount, setClickCount] = useState(0);

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.replace('/login');
    });
  }, []);

  // Avatar 5-click → admin
  const handleAvatarClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        window.location.replace('/admin');
        return 0;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 max-w-md mx-auto">
      {/* Page header */}
      <div className="bg-white px-4 pt-10 pb-4 border-b border-slate-100">
        <h2 className="text-base font-extrabold text-slate-800 capitalize">{activeTab}</h2>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "home"    && <HomeTab />}
        {activeTab === "reserve" && <ReserveTab />}
        {activeTab === "stake"   && <StakeTab />}
        {activeTab === "asset"   && <AssetTab />}
        {activeTab === "profile" && <ProfileTab onAvatarClick={handleAvatarClick} />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 shadow-lg z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1"
                style={{ borderTop: active ? '2px solid #1E3A8A' : '2px solid transparent', marginTop: active ? -2 : 0 }}>
                <Icon size={21} strokeWidth={active ? 2.5 : 2} color={active ? '#1E3A8A' : '#9ca3af'} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#1E3A8A' : '#9ca3af' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
