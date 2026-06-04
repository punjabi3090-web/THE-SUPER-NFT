import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign, Sparkles, RefreshCw, MoreVertical, Bell, Send, Headphones,
  Users, Trophy, FileText, Share2, ShoppingCart, Clock,
  ArrowDownCircle, ArrowUpCircle, Shield,
} from "lucide-react";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Profile    = { balance: number | null; full_name: string | null };
type UserStats  = { dailyIncome: number; totalIncome: number; team: number; activity: number; bid: number };
type TeamData   = { community: number; valid: number; aEnthusiast: number; bcEnthusiast: number };
type OrderData  = { total: number; processing: number; bought: number; sold: number };

const Z_STATS: UserStats = { dailyIncome: 0, totalIncome: 0, team: 0, activity: 0, bid: 0 };
const Z_TEAM: TeamData   = { community: 0, valid: 0, aEnthusiast: 0, bcEnthusiast: 0 };
const Z_ORD: OrderData   = { total: 0, processing: 0, bought: 0, sold: 0 };

/* ── Skeleton block ── */
const Skel = ({ h = "h-6", w = "w-full" }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} rounded-md bg-gray-200 animate-pulse`} />
);

export default function HomeTab() {
  const navigate = useNavigate();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [stats,    setStats]    = useState<UserStats>(Z_STATS);
  const [team,     setTeam]     = useState<TeamData>(Z_TEAM);
  const [orders,   setOrders]   = useState<OrderData>(Z_ORD);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    /* ── Parallel fetch group 1 ── */
    const [
      profRes, dailyRes, totalRes, actRes, bidRes, teamRes,
      ordTotalRes, ordPendRes, ordApprRes, soldRes, adminRes,
    ] = await Promise.all([
      supabase.from("profiles").select("balance, full_name")
        .eq("id", user.id).single(),

      supabase.from("deposits").select("amount")
        .eq("user_id", user.id).eq("status", "approved")
        .gte("created_at", todayStart.toISOString()),

      supabase.from("deposits").select("amount")
        .eq("user_id", user.id).eq("status", "approved"),

      supabase.from("deposits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase.from("deposits").select("amount")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1),

      /* team / community = profiles where referred_by = me */
      supabase.from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", user.id),

      /* My Orders: total */
      supabase.from("deposits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      /* processing */
      supabase.from("deposits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("status", "pending"),

      /* bought (approved deposits) */
      supabase.from("deposits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("status", "approved"),

      /* sold (approved withdrawals) */
      supabase.from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("status", "approved"),

      /* admin check */
      supabase.from("admins").select("email")
        .eq("email", user.email ?? "").maybeSingle(),
    ]);

    /* ── My Team section: valid/enthusiast need referred_by col on deposits ── */
    const [validRes, aRes, bcRes] = await Promise.all([
      supabase.from("deposits")
        .select("user_id", { count: "exact" })
        .eq("referred_by", user.id).eq("status", "approved").gt("amount", 0),

      supabase.from("deposits")
        .select("user_id", { count: "exact" })
        .eq("referred_by", user.id).eq("status", "approved").gte("amount", 100),

      supabase.from("deposits")
        .select("user_id", { count: "exact" })
        .eq("referred_by", user.id).eq("status", "approved")
        .gte("amount", 20).lt("amount", 100),
    ]);

    const dailyIncome = (dailyRes.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const totalIncome = (totalRes.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const bidAmount   = (bidRes.data ?? [])[0]?.amount ?? 0;

    setProfile(profRes.data ?? null);
    setStats({
      dailyIncome,
      totalIncome,
      team:     teamRes.count ?? 0,
      activity: actRes.count ?? 0,
      bid:      bidAmount,
    });
    setTeam({
      community:   teamRes.count ?? 0,
      valid:       validRes.count ?? 0,
      aEnthusiast: aRes.count ?? 0,
      bcEnthusiast: bcRes.count ?? 0,
    });
    setOrders({
      total:      ordTotalRes.count ?? 0,
      processing: ordPendRes.count ?? 0,
      bought:     ordApprRes.count ?? 0,
      sold:       soldRes.count ?? 0,
    });
    setIsAdmin(!!adminRes.data);
    setLoading(false);
  }, [navigate]);

  /* Initial load + 30-second auto-refresh */
  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  /* Close menu on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
      else             { toast("No pending profit to claim.", { icon: "ℹ️" }); }
    }
    setClaiming(false);
  };

  const balance = profile?.balance ?? 0;

  /* ───────── LOADING SKELETON ───────── */
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 pb-4" style={{ background: BG, minHeight: "100vh" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2"><Skel h="h-3" w="w-24" /><Skel h="h-7" w="w-36" /></div>
          <Skel h="h-9" w="w-9" />
        </div>

        {/* balance card skeleton */}
        <div className="rounded-3xl p-6 mb-5 space-y-3" style={{ background: "#c7d2e7" }}>
          <Skel h="h-3" w="w-24" /><Skel h="h-12" w="w-40" /><Skel h="h-3" w="w-12" />
        </div>

        {/* stats skeleton */}
        <div className="rounded-lg p-4 mb-4 space-y-3 bg-gray-800">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between"><Skel h="h-4" w="w-28" /><Skel h="h-4" w="w-20" /></div>
          ))}
        </div>

        {/* team skeleton */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <Skel h="h-5" w="w-24" /><div className="grid grid-cols-4 gap-2 mt-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="space-y-2"><Skel h="h-10" /><Skel h="h-3" /></div>)}</div>
        </div>

        {/* orders skeleton */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <Skel h="h-5" w="w-28" /><div className="grid grid-cols-4 gap-2 mt-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="space-y-2"><Skel h="h-10" /><Skel h="h-3" /></div>)}</div>
        </div>

        {/* claim button skeleton */}
        <Skel h="h-14" w="w-full" />
      </div>
    );
  }

  /* ───────── MAIN RENDER ───────── */
  const statsRows = [
    { label: "Daily Income",  value: `$${stats.dailyIncome.toFixed(2)}`, hl: true },
    { label: "Total Income",  value: `$${stats.totalIncome.toFixed(2)}`, hl: true },
    { label: "Comprehensive", value: "20",                                hl: false },
    { label: "Claim",         value: "1.5",                               hl: false },
    { label: "Team",          value: String(stats.team),                  hl: false },
    { label: "Activity",      value: String(stats.activity),              hl: false },
    { label: "Bid",           value: stats.bid > 0 ? `$${stats.bid.toFixed(2)}` : "—", hl: false },
  ];

  const teamBoxes = [
    {
      label: ["Community", "rewards"],
      value: team.community,
      icon: <Users className="w-6 h-6 mx-auto mt-2" style={{ color: "#3b82f6" }} />,
      sub: "Community enthusiasts",
    },
    {
      label: ["Valid", "Members"],
      value: team.valid,
      icon: <Trophy className="w-6 h-6 mx-auto mt-2" style={{ color: "#eab308" }} />,
      sub: "Community contributions",
    },
    {
      label: ["A", "enthusiast"],
      value: team.aEnthusiast,
      icon: <FileText className="w-6 h-6 mx-auto mt-2" style={{ color: "#3b82f6" }} />,
      sub: "Community orders",
    },
    {
      label: ["B+C", "enthusiasts"],
      value: team.bcEnthusiast,
      icon: <Share2 className="w-6 h-6 mx-auto mt-2" style={{ color: "#22c55e" }} />,
      sub: "Referral",
    },
  ];

  const orderBoxes = [
    {
      label: "Orders",
      value: orders.total,
      icon: <ShoppingCart className="w-6 h-6 mx-auto mt-2" style={{ color: "#3b82f6" }} />,
      sub: "My Bid",
    },
    {
      label: "Processing",
      value: orders.processing,
      icon: <Clock className="w-6 h-6 mx-auto mt-2" style={{ color: "#eab308" }} />,
      sub: "",
    },
    {
      label: "Bought",
      value: orders.bought,
      icon: <ArrowDownCircle className="w-6 h-6 mx-auto mt-2" style={{ color: "#22c55e" }} />,
      sub: "",
    },
    {
      label: "Sold",
      value: orders.sold,
      icon: <ArrowUpCircle className="w-6 h-6 mx-auto mt-2" style={{ color: R }} />,
      sub: "Details",
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4" style={{ background: BG, minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold" style={{ color: B }}>
            {profile?.full_name?.split(" ")[0] ?? "User"} 👋
          </h1>
        </div>

        {/* 3-dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-white transition-colors"
            style={{ color: B }}
          >
            <MoreVertical size={22} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-50">
              <button
                onClick={() => { setMenuOpen(false); toast("Notifications — Coming Soon!", { icon: "🔔" }); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                style={{ color: B }}
              >
                <Bell size={16} style={{ color: R }} /> Notifications
              </button>

              <button
                onClick={() => { setMenuOpen(false); window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                style={{ color: B }}
              >
                <Send size={16} style={{ color: R }} /> Telegram
              </button>

              <button
                onClick={() => { setMenuOpen(false); window.open("https://t.me/TigerProtocolGlobal", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                style={{ color: B }}
              >
                <Headphones size={16} style={{ color: R }} /> Customer Service
              </button>

              {isAdmin && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-red-50"
                    style={{ color: R }}
                  >
                    <Shield size={16} style={{ color: R }} /> Admin Panel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="rounded-3xl p-6 mb-5 relative overflow-hidden" style={{ background: B }}>
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

      {/* ══════════════════════════════════════
          SECTION 1 — STATS TABLE
      ══════════════════════════════════════ */}
      <div className="rounded-lg p-4 mb-4" style={{ background: "#111827" }}>
        {statsRows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: i < statsRows.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
          >
            <span className="text-sm text-gray-400">{row.label}</span>
            <span
              className="text-sm font-bold"
              style={{ color: row.hl ? R : "#f9fafb" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════
          SECTION 2 — MY TEAM
      ══════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <p className="text-lg font-semibold mb-3" style={{ color: B }}>My Team</p>
        <div className="grid grid-cols-4 gap-2">
          {teamBoxes.map(box => (
            <div key={box.label[0]} className="flex flex-col items-center text-center pb-2">
              {box.icon}
              <p className="text-2xl font-bold text-gray-900 mt-1">{box.value}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">
                {box.label[0]}<br />{box.label[1]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 3 — MY ORDERS
      ══════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-semibold" style={{ color: B }}>My Orders</p>
          <button
            onClick={() => navigate("/orders")}
            className="text-xs font-medium"
            style={{ color: R }}
          >
            Check Orders &gt;
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {orderBoxes.map(box => (
            <div key={box.label} className="flex flex-col items-center text-center pb-2">
              {box.icon}
              <p className="text-2xl font-bold text-gray-900 mt-1">{box.value}</p>
              <p className="text-xs text-gray-500 mt-1">{box.label}</p>
              {box.sub && <p className="text-[10px] text-gray-400">{box.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 4 — CLAIM PROFIT BUTTON
      ══════════════════════════════════════ */}
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full flex items-center justify-center gap-2.5 font-bold text-sm rounded-2xl py-4 text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: claiming ? "#b91c1c" : R }}
        onMouseEnter={e => !claiming && ((e.currentTarget as HTMLElement).style.background = "#b91c1c")}
        onMouseLeave={e => !claiming && ((e.currentTarget as HTMLElement).style.background = R)}
      >
        {claiming
          ? <><RefreshCw size={16} className="animate-spin" /> Claiming...</>
          : <><Sparkles size={16} /> Claim Profit</>
        }
      </button>
    </div>
  );
}
