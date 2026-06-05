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

const Skel = ({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} rounded bg-gray-200 animate-pulse`} />
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

    const uid = user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    /* ── Profile ── */
    const { data: prof } = await supabase
      .from("profiles").select("balance, full_name").eq("id", uid).single();
    setProfile(prof ?? null);

    /* ── Admin check — try admins table, fallback to profiles.role ── */
    try {
      const { data: adminRow } = await supabase
        .from("admins").select("email").eq("email", user.email ?? "").maybeSingle();
      if (adminRow) { setIsAdmin(true); }
      else {
        const { data: profRole } = await supabase
          .from("profiles").select("role").eq("id", uid).single();
        setIsAdmin(profRole?.role === "admin");
      }
    } catch { setIsAdmin(false); }

    /* ── Stats table queries (deposits only, no risk of missing table) ── */
    const [dailyRes, totalRes, actRes, bidRes] = await Promise.all([
      supabase.from("deposits").select("amount")
        .eq("user_id", uid).eq("status", "approved").gte("created_at", todayStart.toISOString()),
      supabase.from("deposits").select("amount")
        .eq("user_id", uid).eq("status", "approved"),
      supabase.from("deposits").select("*", { count: "exact", head: true })
        .eq("user_id", uid),
      supabase.from("deposits").select("amount")
        .eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
    ]);

    const dailyIncome = (dailyRes.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const totalIncome = (totalRes.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    const bidAmount   = (bidRes.data ?? [])[0]?.amount ?? 0;

    /* ── Community count — uses `users` table (referred_by column) ── */
    const { count: communityCount } = await supabase
      .from("users").select("*", { count: "exact", head: true }).eq("referred_by", uid);

    setStats({
      dailyIncome, totalIncome,
      team:     communityCount ?? 0,
      activity: actRes.count ?? 0,
      bid:      bidAmount,
    });

    /* ── My Team — distinct user_id via Set (deposits.referred_by = uid) ── */
    const [validData, aData, bData] = await Promise.all([
      supabase.from("deposits").select("user_id")
        .eq("referred_by", uid).eq("status", "approved").gt("amount", 0),
      supabase.from("deposits").select("user_id")
        .eq("referred_by", uid).eq("status", "approved").gte("amount", 100),
      supabase.from("deposits").select("user_id")
        .eq("referred_by", uid).eq("status", "approved").gte("amount", 20).lt("amount", 100),
    ]);

    setTeam({
      community:   communityCount ?? 0,
      valid:       new Set((validData.data ?? []).map((d: { user_id: string }) => d.user_id)).size,
      aEnthusiast: new Set((aData.data    ?? []).map((d: { user_id: string }) => d.user_id)).size,
      bcEnthusiast: new Set((bData.data   ?? []).map((d: { user_id: string }) => d.user_id)).size,
    });

    /* ── My Orders ── */
    const [ordTotal, ordPend, ordAppr] = await Promise.all([
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("user_id", uid).eq("status", "pending"),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("user_id", uid).eq("status", "approved"),
    ]);

    /* sold — try withdrawals, silently 0 if table missing */
    let soldCount = 0;
    try {
      const { count } = await supabase
        .from("withdrawals").select("*", { count: "exact", head: true })
        .eq("user_id", uid).eq("status", "approved");
      soldCount = count ?? 0;
    } catch { soldCount = 0; }

    setOrders({
      total:      ordTotal.count ?? 0,
      processing: ordPend.count  ?? 0,
      bought:     ordAppr.count  ?? 0,
      sold:       soldCount,
    });

    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setClaiming(false); return; }
    const { data, error } = await supabase.rpc("claim_user_profit", { p_user_id: user.id });
    if (error) { toast.error("Failed: " + error.message); }
    else {
      const amount = Number(data ?? 0);
      if (amount > 0) { toast.success(`Claimed $${amount.toFixed(2)} ✓`); load(); }
      else { toast("No pending profit to claim.", { icon: "ℹ️" }); }
    }
    setClaiming(false);
  };

  /* ── LOADING SKELETON ── */
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-3 pt-3 pb-2" style={{ background: BG, minHeight: "100vh" }}>
        <div className="flex items-center justify-between h-14 mb-2">
          <div className="flex items-center gap-2"><Skel h="h-8" w="w-8" /><Skel h="h-5" w="w-24" /></div>
          <Skel h="h-8" w="w-8" />
        </div>
        <div className="rounded-2xl p-3 mb-2 space-y-1.5" style={{ background: "#c7d2e7" }}>
          <Skel h="h-3" w="w-20" /><Skel h="h-8" w="w-32" /><Skel h="h-3" w="w-10" />
        </div>
        <div className="rounded-xl p-3 mb-2 bg-green-50 border border-green-200 space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between"><Skel h="h-3" w="w-24" /><Skel h="h-3" w="w-16" /></div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 mb-2">
          <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-16" />)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 mb-2">
          <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-16" />)}</div>
        </div>
        <Skel h="h-9" w="w-full" />
      </div>
    );
  }

  const balance = profile?.balance ?? 0;

  const statsRows = [
    { label: "Daily Income",  value: `$${stats.dailyIncome.toFixed(2)}`,             hl: true },
    { label: "Total Income",  value: `$${stats.totalIncome.toFixed(2)}`,             hl: true },
    { label: "Comprehensive", value: "20",                                            hl: false },
    { label: "Claim",         value: "1.5",                                           hl: false },
    { label: "Team",          value: String(stats.team),                              hl: false },
    { label: "Activity",      value: String(stats.activity),                          hl: false },
    { label: "Bid",           value: stats.bid > 0 ? `$${stats.bid.toFixed(2)}` : "—", hl: false },
  ];

  const teamBoxes = [
    { label: ["Total Register", "Members"],  value: team.community,    icon: <Users    className="w-5 h-5 mx-auto mt-1" style={{ color: "#3b82f6" }} /> },
    { label: ["Valid",     "Members"],  value: team.valid,        icon: <Trophy   className="w-5 h-5 mx-auto mt-1" style={{ color: "#eab308" }} /> },
    { label: ["A",         "enthusiast"], value: team.aEnthusiast, icon: <FileText className="w-5 h-5 mx-auto mt-1" style={{ color: "#3b82f6" }} /> },
    { label: ["B+C",       "enthusiasts"], value: team.bcEnthusiast, icon: <Share2 className="w-5 h-5 mx-auto mt-1" style={{ color: "#22c55e" }} /> },
  ];

  const orderBoxes = [
    { label: "Orders",     value: orders.total,      icon: <ShoppingCart    className="w-5 h-5 mx-auto mt-1" style={{ color: "#3b82f6" }} /> },
    { label: "Processing", value: orders.processing, icon: <Clock           className="w-5 h-5 mx-auto mt-1" style={{ color: "#eab308" }} /> },
    { label: "Bought",     value: orders.bought,     icon: <ArrowDownCircle className="w-5 h-5 mx-auto mt-1" style={{ color: "#22c55e" }} /> },
    { label: "Sold",       value: orders.sold,       icon: <ArrowUpCircle   className="w-5 h-5 mx-auto mt-1" style={{ color: R }} /> },
  ];

  return (
    <div className="max-w-md mx-auto px-3 pt-3 pb-2" style={{ background: BG, minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />

      {/* ── Header h-14 ── */}
      <div className="flex items-center justify-between h-14 mb-2">
        <div className="flex items-center gap-2">
          <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
          <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent leading-tight">
            THE SUPER NFT
          </h1>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 rounded-xl hover:bg-white transition-colors" style={{ color: B }}>
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-50">
              <button onClick={() => { setMenuOpen(false); toast("Notifications — Coming Soon!", { icon: "🔔" }); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50" style={{ color: B }}>
                <Bell size={14} style={{ color: R }} /> Notifications
              </button>
              <button onClick={() => { setMenuOpen(false); window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50" style={{ color: B }}>
                <Send size={14} style={{ color: R }} /> Telegram
              </button>
              <button onClick={() => { setMenuOpen(false); window.open("https://t.me/TigerProtocolGlobal", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50" style={{ color: B }}>
                <Headphones size={14} style={{ color: R }} /> Customer Service
              </button>
              {isAdmin && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-red-50" style={{ color: R }}>
                    <Shield size={14} style={{ color: R }} /> Admin Panel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="rounded-2xl p-3 mb-2 relative overflow-hidden" style={{ background: B }}>
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 bg-white -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-1 opacity-70">
            <DollarSign size={12} className="text-white" />
            <p className="text-xs font-medium text-white">Wallet Balance</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white leading-tight">${balance.toFixed(2)}</p>
          <p className="text-[10px] text-white opacity-50 mt-0.5">USDT</p>
        </div>
      </div>

      {/* ══ SECTION 1 — STATS TABLE (light green) ══ */}
      <div className="rounded-xl mb-2 overflow-hidden border border-green-200 bg-green-50">
        {statsRows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-1.5"
            style={{ borderBottom: i < statsRows.length - 1 ? "1px solid #bbf7d0" : "none" }}
          >
            <span className="text-xs text-gray-600 leading-tight">{row.label}</span>
            <span className="text-sm font-bold leading-tight" style={{ color: row.hl ? R : "#166534" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* ══ SECTION 2 — MY TEAM ══ */}
      <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
        <p className="text-xs font-bold mb-2" style={{ color: B }}>My Team</p>
        <div className="grid grid-cols-4 gap-1.5">
          {teamBoxes.map(box => (
            <div key={box.label[0]} className="flex flex-col items-center text-center">
              {box.icon}
              <p className="text-base font-bold text-gray-900 leading-tight mt-0.5">{box.value}</p>
              <p className="text-[9px] text-gray-500 leading-tight">{box.label[0]}<br />{box.label[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECTION 3 — MY ORDERS ══ */}
      <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold" style={{ color: B }}>My Orders</p>
          <button onClick={() => navigate("/orders")} className="text-[10px] font-semibold" style={{ color: R }}>
            Check Orders &gt;
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {orderBoxes.map(box => (
            <div key={box.label} className="flex flex-col items-center text-center">
              {box.icon}
              <p className="text-base font-bold text-gray-900 leading-tight mt-0.5">{box.value}</p>
              <p className="text-[9px] text-gray-500 leading-tight">{box.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECTION 4 — CLAIM PROFIT ══ */}
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full flex items-center justify-center gap-2 font-bold text-sm rounded-xl h-9 text-white transition-all active:scale-95 disabled:opacity-60"
        style={{ background: claiming ? "#b91c1c" : R }}
        onMouseEnter={e => !claiming && ((e.currentTarget as HTMLElement).style.background = "#b91c1c")}
        onMouseLeave={e => !claiming && ((e.currentTarget as HTMLElement).style.background = R)}
      >
        {claiming ? <><RefreshCw size={14} className="animate-spin" /> Claiming...</> : <><Sparkles size={14} /> Claim Profit</>}
      </button>
    </div>
  );
}
