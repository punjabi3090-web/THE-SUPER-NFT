import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { LogOut, Copy, Check, User, DollarSign, TrendingUp, ArrowUpRight, Users, Shield, X, ChevronRight } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ClaimProfitButton from "../components/ClaimProfitButton";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  user_id: string | null;
  referral_code: string | null;
  role: string | null;
  level: number | null;
  balance: number | null;
  total_earned: number | null;
  total_withdrawn: number | null;
  created_at: string | null;
};

type TeamMember = { id: string; email: string | null };

type TeamStats = {
  totalRegister: number;
  bcRegister: number;
  aEnthusiast: number;
  bcEnthusiast: number;
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [profLoading, setProfLoading] = useState(true);
  const [copied, setCopied]           = useState(false);

  const [teamStats, setTeamStats]             = useState<TeamStats>({ totalRegister: 0, bcRegister: 0, aEnthusiast: 0, bcEnthusiast: 0 });
  const [level1List, setLevel1List]           = useState<TeamMember[]>([]);
  const [level2List, setLevel2List]           = useState<TeamMember[]>([]);
  const [aEnthusiastList, setAEnthusiastList] = useState<TeamMember[]>([]);
  const [bcEnthusiastList, setBcEnthusiastList] = useState<TeamMember[]>([]);
  const [activeList, setActiveList]           = useState<TeamMember[]>([]);
  const [activeListTitle, setActiveListTitle] = useState("");
  const [showListModal, setShowListModal]     = useState(false);

  const loadTeamStats = useCallback(async (myCode: string) => {
    if (!myCode) return;

    // ── Level 1 users (directly referred by me) ──
    const { data: l1 } = await supabase
      .from('profiles')
      .select('id, user_id, email, referral_code')
      .eq('referred_by_code', myCode);

    const level1Users: TeamMember[] = (l1 ?? []).map(u => ({ id: u.user_id ?? u.id, email: u.email }));
    const level1Count  = level1Users.length;
    const level1Ids    = level1Users.map(u => u.id);
    const level1Codes  = (l1 ?? []).map(u => u.referral_code as string).filter(Boolean);

    // ── Level 2 users (referred by my Level 1) ──
    let level2Users: TeamMember[] = [];
    let level2Ids: string[] = [];

    if (level1Codes.length > 0) {
      const { data: l2 } = await supabase
        .from('profiles')
        .select('id, user_id, email')
        .in('referred_by_code', level1Codes);
      level2Users = (l2 ?? []).map(u => ({ id: u.user_id ?? u.id, email: u.email }));
      level2Ids   = level2Users.map(u => u.id);
    }
    const level2Count = level2Users.length;

    // ── A Enthusiast: Level 1 users with completed deposit > 0 ──
    let aEnthusiastCount = 0;
    let aList: TeamMember[] = [];

    if (level1Ids.length > 0) {
      const { data: aDeposits } = await supabase
        .from('deposits')
        .select('user_id')
        .in('user_id', level1Ids)
        .eq('status', 'completed')
        .gt('amount', 0);

      const aUserIds = [...new Set((aDeposits ?? []).map(d => d.user_id as string))];
      aEnthusiastCount = aUserIds.length;
      aList = level1Users.filter(u => aUserIds.includes(u.id));
    }

    // ── B/C Enthusiast: Level 2 users with completed deposit > 0 ──
    let bcEnthusiastCount = 0;
    let bcList: TeamMember[] = [];

    if (level2Ids.length > 0) {
      const { data: bcDeposits } = await supabase
        .from('deposits')
        .select('user_id')
        .in('user_id', level2Ids)
        .eq('status', 'completed')
        .gt('amount', 0);

      const bcUserIds = [...new Set((bcDeposits ?? []).map(d => d.user_id as string))];
      bcEnthusiastCount = bcUserIds.length;
      bcList = level2Users.filter(u => bcUserIds.includes(u.id));
    }

    setTeamStats({ totalRegister: level1Count, bcRegister: level2Count, aEnthusiast: aEnthusiastCount, bcEnthusiast: bcEnthusiastCount });
    setLevel1List(level1Users);
    setLevel2List(level2Users);
    setAEnthusiastList(aList);
    setBcEnthusiastList(bcList);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(data);
    if (data?.referral_code) {
      await loadTeamStats(data.referral_code);
    }
    setProfLoading(false);
  }, [user, loadTeamStats]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
  };

  const handleCopy = () => {
    const link = `${window.location.origin}?ref=${profile?.referral_code ?? ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openList = (title: string, list: TeamMember[]) => {
    setActiveListTitle(title);
    setActiveList(list);
    setShowListModal(true);
  };

  if (authLoading || profLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initial     = displayName[0].toUpperCase();
  const balance     = profile?.balance ?? 0;
  const earned      = profile?.total_earned ?? 0;
  const withdrawn   = profile?.total_withdrawn ?? 0;
  const refLink     = `${window.location.origin}?ref=${profile?.referral_code ?? ''}`;

  const statBoxes = [
    {
      label: "Total Register Members",
      value: teamStats.totalRegister,
      color: "text-purple-400",
      border: "border-purple-500/30",
      list: level1List,
    },
    {
      label: "Total B/C Register Members",
      value: teamStats.bcRegister,
      color: "text-blue-400",
      border: "border-blue-500/30",
      list: level2List,
    },
    {
      label: "A Enthusiast",
      value: teamStats.aEnthusiast,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      list: aEnthusiastList,
    },
    {
      label: "B/C Enthusiast",
      value: teamStats.bcEnthusiast,
      color: "text-amber-400",
      border: "border-amber-500/30",
      list: bcEnthusiastList,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#fff", border: "1px solid #334155" } }} />

      {/* ── User List Modal ── */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowListModal(false); }}>
          <div className="bg-slate-800 w-full max-w-md rounded-t-2xl p-5 pb-10 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <p className="font-bold text-white text-sm">{activeListTitle} ({activeList.length})</p>
              <button onClick={() => setShowListModal(false)}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <X size={15} className="text-slate-300" />
              </button>
            </div>
            {activeList.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No members yet</p>
            ) : (
              <div className="overflow-y-auto space-y-2">
                {activeList.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-700 rounded-xl px-3 py-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white font-medium truncate">{m.email || '—'}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">ID: {m.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* ── Claim Profit ─── */}
        <div className="mb-4">
          <ClaimProfitButton onClaimed={fetchProfile} />
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
              { label: "Email",         value: user.email },
              { label: "User ID",       value: user.id },
              { label: "Full Name",     value: profile?.full_name },
              { label: "Phone",         value: profile?.phone },
              { label: "Country",       value: profile?.country },
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

        {/* ── Nav Buttons ─── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { emoji: "🖼️", label: "NFT Collections", path: "/nft" },
            { emoji: "💰", label: "Deposit",          path: "/deposit" },
            { emoji: "💸", label: "Withdraw",         path: "/withdraw" },
            { emoji: "👥", label: "My Team",          path: "/team" },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-colors active:scale-95"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-slate-300 font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── My Team Stats ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-400" />
            <p className="font-semibold text-white text-sm">My Team</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statBoxes.map(box => (
              <button
                key={box.label}
                onClick={() => openList(box.label, box.list)}
                className={`bg-slate-700 hover:bg-slate-600 rounded-xl p-3 text-left border transition-colors active:scale-95 ${box.border}`}
              >
                <p className={`text-2xl font-extrabold ${box.color}`}>{box.value}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{box.label}</p>
                <div className="flex items-center gap-0.5 mt-2 opacity-50">
                  <p className="text-[9px] text-slate-400">View list</p>
                  <ChevronRight size={9} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Admin Panel Button (admin only) ─── */}
        {profile?.role === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 rounded-2xl p-4 transition-colors active:scale-95"
          >
            <Shield size={16} className="text-purple-200" />
            <span className="text-sm font-semibold text-white">Admin Panel</span>
          </button>
        )}

        {/* ── Referral Link ─── */}
        <div className="bg-slate-800 rounded-2xl p-5">
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

      </div>
    </div>
  );
}
