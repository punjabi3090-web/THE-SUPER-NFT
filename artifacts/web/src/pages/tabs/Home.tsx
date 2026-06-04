import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign, Sparkles, RefreshCw, ArrowDownLeft, ArrowUpRight,
  Clock, TrendingUp, MoreVertical, Bell, Send, Headphones, Users,
} from "lucide-react";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

type Profile    = { balance: number | null; full_name: string | null; referral_code: string | null };
type Tx         = { id: string; type: string; amount: number; description: string | null; created_at: string };
type UserStats  = { dailyIncome: number; totalIncome: number; teamCount: number; activityCount: number; bidAmount: number };
type TeamCounts = { level1: number; level2: number; level3: number; total: number };

const ZERO_STATS: UserStats  = { dailyIncome: 0, totalIncome: 0, teamCount: 0, activityCount: 0, bidAmount: 0 };
const ZERO_TEAM: TeamCounts  = { level1: 0, level2: 0, level3: 0, total: 0 };

export default function HomeTab() {
  const navigate = useNavigate();
  const [profile,    setProfile]   = useState<Profile | null>(null);
  const [txs,        setTxs]       = useState<Tx[]>([]);
  const [stats,      setStats]     = useState<UserStats>(ZERO_STATS);
  const [team,       setTeam]      = useState<TeamCounts>(ZERO_TEAM);
  const [loading,    setLoading]   = useState(true);
  const [claiming,   setClaiming]  = useState(false);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { data: prof },
      { data: txData },
      { data: dailyDeps },
      { data: totalDeps },
      { count: activityCount },
      { data: latestDep },
      { count: teamCount },
    ] = await Promise.all([
      supabase.from("profiles").select("balance, full_name, referral_code").eq("id", user.id).single(),
      supabase.from("transactions").select("id, type, amount, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("deposits").select("amount")
        .eq("user_id", user.id).eq("status", "approved")
        .gte("created_at", todayStart.toISOString()),
      supabase.from("deposits").select("amount")
        .eq("user_id", user.id).eq("status", "approved"),
      supabase.from("deposits").select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase.from("deposits").select("amount")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("referred_by", user.id),
    ]);

    const dailyIncome  = (dailyDeps  ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const totalIncome  = (totalDeps  ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const bidAmount    = (latestDep ?? [])[0]?.amount ?? 0;
    const l1Count      = teamCount ?? 0;

    setProfile(prof ?? null);
    setTxs((txData ?? []) as Tx[]);
    setStats({ dailyIncome, totalIncome, teamCount: l1Count, activityCount: activityCount ?? 0, bidAmount });

    /* ── Multi-level team counts ── */
    let level1Ids: string[] = [];
    if (l1Count > 0) {
      const { data: l1Data } = await supabase.from("profiles").select("id").eq("referred_by", user.id);
      level1Ids = (l1Data ?? []).map((r: { id: string }) => r.id);
    }

    let l2Count = 0;
    let level2Ids: string[] = [];
    if (level1Ids.length > 0) {
      const { count, data: l2Data } = await supabase.from("profiles")
        .select("id", { count: "exact" })
        .in("referred_by", level1Ids);
      l2Count    = count ?? 0;
      level2Ids  = (l2Data ?? []).map((r: { id: string }) => r.id);
    }

    let l3Count = 0;
    if (level2Ids.length > 0) {
      const { count } = await supabase.from("profiles")
        .select("*", { count: "exact", head: true })
        .in("referred_by", level2Ids);
      l3Count = count ?? 0;
    }

    setTeam({ level1: l1Count, level2: l2Count, level3: l3Count, total: l1Count + l2Count + l3Count });
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setClaiming(false); return; }
    const { data, error } = await supabase.rpc("claim_user_profit", { p_user_id: user.id });
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      const amount = Number(data ?? 0);
      if (amount > 0) { toast.success(`Claimed $${amount.toFixed(2)} ✓`); load(); }
      else { toast("No pending profit to claim.", { icon: "ℹ️" }); }
    }
    setClaiming(false);
  };

  const txIcon = (type: string) => {
    if (type === "nft_profit") return <TrendingUp size={14} style={{ color: "#16a34a" }} />;
    if (type === "deposit")    return <ArrowDownLeft size={14} style={{ color: BRAND.blue }} />;
    if (type === "withdraw")   return <ArrowUpRight size={14} style={{ color: BRAND.red }} />;
    return <Clock size={14} className="text-gray-400" />;
  };

  const txColor = (type: string) => {
    if (type === "nft_profit" || type === "deposit") return "#16a34a";
    if (type === "withdraw") return BRAND.red;
    return BRAND.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: BRAND.bg }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${BRAND.red} transparent transparent transparent` }} />
      </div>
    );
  }

  const balance = profile?.balance ?? 0;

  /* ── Stats rows ── */
  const statsRows = [
    { label: "Daily Income",      value: `$${stats.dailyIncome.toFixed(2)}`,  highlight: true },
    { label: "Total Income",      value: `$${stats.totalIncome.toFixed(2)}`,  highlight: true },
    { label: "Comprehensive",     value: "20",                                 highlight: false },
    { label: "Claim",             value: "1.5",                                highlight: false },
    { label: "Team",              value: String(stats.teamCount),              highlight: false },
    { label: "Activity",          value: String(stats.activityCount),          highlight: false },
    { label: "Bid",               value: stats.bidAmount > 0 ? `$${stats.bidAmount.toFixed(2)}` : "—", highlight: false },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4" style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: BRAND.blue, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.blue }}>
            {profile?.full_name?.split(" ")[0] ?? "User"} 👋
          </h1>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-xl hover:bg-white transition-colors" style={{ color: BRAND.blue }}>
            <MoreVertical size={22} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-50">
              <button onClick={() => { setMenuOpen(false); toast("Notifications — Coming Soon!", { icon: "🔔" }); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors" style={{ color: BRAND.blue }}>
                <Bell size={16} style={{ color: BRAND.red }} /> Notifications
              </button>
              <button onClick={() => { setMenuOpen(false); window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors" style={{ color: BRAND.blue }}>
                <Send size={16} style={{ color: BRAND.red }} /> Telegram
              </button>
              <button onClick={() => { setMenuOpen(false); window.open("https://t.me/TigerProtocolGlobal", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors" style={{ color: BRAND.blue }}>
                <Headphones size={16} style={{ color: BRAND.red }} /> Customer Service
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="rounded-3xl p-6 mb-5 relative overflow-hidden" style={{ background: BRAND.blue }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 bg-white translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2 opacity-70">
            <DollarSign size={14} className="text-white" />
            <p className="text-xs font-medium text-white">Wallet Balance</p>
          </div>
          <p className="text-5xl font-bold tracking-tight text-white">${balance.toFixed(2)}</p>
          <p className="text-xs text-white opacity-50 mt-1.5">USDT</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 1 — STATS TABLE
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-gray-50">
          <p className="text-sm font-bold" style={{ color: BRAND.blue }}>My Statistics</p>
        </div>
        <div className="divide-y divide-gray-50">
          {statsRows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-5 py-3"
              style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFF" }}
            >
              <span className="text-sm text-gray-500 font-medium">{row.label}</span>
              <span
                className="text-sm font-bold"
                style={{ color: row.highlight ? BRAND.red : BRAND.blue }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2 — MY TEAM
      ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 p-5">
        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users size={16} style={{ color: BRAND.red }} />
          <p className="text-sm font-bold text-center" style={{ color: BRAND.blue }}>My Team</p>
        </div>

        {/* 4 boxes: 2×2 on mobile, 4-col on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Level 1",    value: team.level1, emoji: "🥇", bg: "#FEF2F2", border: "#FECACA", color: BRAND.red },
            { label: "Level 2",    value: team.level2, emoji: "🥈", bg: "#EFF6FF", border: "#BFDBFE", color: BRAND.blue },
            { label: "Level 3",    value: team.level3, emoji: "🥉", bg: "#F0FDF4", border: "#BBF7D0", color: "#16a34a" },
            { label: "Total Team", value: team.total,  emoji: "👥", bg: "#FFF7ED", border: "#FDE68A", color: "#D97706" },
          ].map(box => (
            <div
              key={box.label}
              className="rounded-2xl p-4 flex flex-col items-center gap-1.5 border"
              style={{ background: box.bg, borderColor: box.border }}
            >
              <span className="text-2xl">{box.emoji}</span>
              <p className="text-2xl font-bold" style={{ color: box.color }}>{box.value}</p>
              <p className="text-[11px] font-semibold text-center text-gray-500 leading-tight">{box.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Claim Button ── */}
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full flex items-center justify-center gap-2.5 font-bold text-sm rounded-2xl py-4 mb-5 text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: claiming ? "#b91c1c" : BRAND.red }}
        onMouseEnter={e => !claiming && ((e.currentTarget as HTMLElement).style.background = "#b91c1c")}
        onMouseLeave={e => !claiming && ((e.currentTarget as HTMLElement).style.background = BRAND.red)}
      >
        {claiming
          ? <><RefreshCw size={16} className="animate-spin" /> Claiming...</>
          : <><Sparkles size={16} /> Claim Profit</>
        }
      </button>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { emoji: "💰", label: "Deposit",  path: "/deposit" },
          { emoji: "💸", label: "Withdraw", path: "/withdraw" },
          { emoji: "🖼️", label: "NFT",     path: "/nft" },
        ].map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="bg-white hover:bg-gray-50 rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-colors active:scale-95 shadow-sm border border-gray-100"
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: BRAND.blue }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Recent Transactions</p>
          <span className="text-xs text-gray-400">Last 5</span>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BRAND.bg }}>
                    {txIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold capitalize" style={{ color: BRAND.blue }}>
                      {tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: txColor(tx.type) }}>
                  {tx.type === "withdraw" ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
