import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign, Sparkles, RefreshCw, MoreVertical, Bell, Send, Headphones,
  Users, Trophy, FileText, Share2, ShoppingCart, Clock,
  ArrowDownCircle, ArrowUpCircle, X, Shield,
} from "lucide-react";
import AnnouncementBanner from "../../components/AnnouncementBanner";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Profile    = { balance: number | null; full_name: string | null };
type UserStats  = { dailyIncome: number; totalIncome: number; team: number; activity: number; bid: number };
type TeamData   = { community: number; valid: number; aEnthusiast: number; bcEnthusiast: number };
type OrderData  = { total: number; processing: number; bought: number; sold: number };
type Ann        = { id: string; message: string; created_at: string };
type Airdrop    = { id: string; title: string; description: string; amount: number };

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
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [anns,         setAnns]         = useState<Ann[]>([]);
  const [reads,        setReads]        = useState<Set<string>>(new Set());
  const [bellOpen,     setBellOpen]     = useState(false);
  const [airdrops,     setAirdrops]     = useState<Airdrop[]>([]);
  const [airdropOpen,  setAirdropOpen]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  /* ── Admin check + notification fetch — runs once on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        /* Admin check */
        if (user.email) {
          const { data } = await supabase
            .from("admins").select("email").eq("email", user.email).single();
          if (data) setIsAdmin(true);
        }

        /* Announcements + reads */
        const [{ data: annData }, { data: readData }] = await Promise.all([
          supabase.from("announcements")
            .select("id, message, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("notification_reads")
            .select("announcement_id")
            .eq("user_id", user.id),
        ]);
        setAnns((annData ?? []) as Ann[]);
        setReads(new Set(
          ((readData ?? []) as { announcement_id: string }[]).map(r => r.announcement_id)
        ));
      } catch { /* silent */ }
    })();
  }, []);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const uid = user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    /* ── Profile ── */
    const { data: prof } = await supabase
      .from("profiles").select("balance, full_name").eq("user_id", uid).single();
    setProfile(prof ?? null);

    /* ── Income & team views ── */
    const [{ data: dailyStats }, { data: teamStats }, actRes, bidRes] = await Promise.all([
      supabase.from("daily_income_stats")
        .select("today_income, total_income").eq("user_id", uid).single(),
      supabase.from("team_stats")
        .select("total_members, valid_members, level_a_members, level_b_members, level_c_members")
        .eq("user_id", uid).single(),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("deposits").select("amount")
        .eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
    ]);

    setStats({
      dailyIncome: dailyStats?.today_income ?? 0,
      totalIncome: dailyStats?.total_income ?? 0,
      team:        teamStats?.total_members ?? 0,
      activity:    actRes.count ?? 0,
      bid:         (bidRes.data ?? [])[0]?.amount ?? 0,
    });

    setTeam({
      community:    teamStats?.total_members ?? 0,
      valid:        teamStats?.valid_members ?? 0,
      aEnthusiast:  teamStats?.level_a_members ?? 0,
      bcEnthusiast: (teamStats?.level_b_members ?? 0) + (teamStats?.level_c_members ?? 0),
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

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);

    const channel = supabase.channel("home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markRead = async (annId: string) => {
    if (!userId || reads.has(annId)) return;
    await supabase.from("notification_reads").insert({ user_id: userId, announcement_id: annId });
    setReads(prev => new Set([...prev, annId]));
  };

  const openAirdrops = async () => {
    const { data } = await supabase.from("airdrops").select("*").eq("is_active", true);
    setAirdrops((data ?? []) as Airdrop[]);
    setAirdropOpen(true);
  };

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
        <div className="flex items-center gap-1.5">

          {/* ── Bell Notification ── */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              className="relative p-1.5 rounded-xl hover:bg-white transition-colors"
              style={{ color: B }}
            >
              <Bell size={18} />
              {anns.some(a => !reads.has(a.id)) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 w-72 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: B }}>Notifications</p>
                  {anns.some(a => !reads.has(a.id)) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: R }}>
                      {anns.filter(a => !reads.has(a.id)).length} new
                    </span>
                  )}
                </div>
                {anns.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No announcements</p>
                ) : (
                  anns.map(ann => (
                    <button
                      key={ann.id}
                      onClick={() => { markRead(ann.id); setBellOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors${reads.has(ann.id) ? " opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!reads.has(ann.id) && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                        <p className="text-xs text-gray-700 leading-relaxed">{ann.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Airdrop ── */}
          <button
            onClick={openAirdrops}
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ color: B, background: "#EFF6FF" }}
          >
            Airdrop
          </button>

          {/* ── 3-dots Menu ── */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 rounded-xl hover:bg-white transition-colors" style={{ color: B }}>
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-50">
                {isAdmin && (
                  <>
                    <button onClick={() => { setMenuOpen(false); navigate("/admin/dashboard"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-red-50" style={{ color: R }}>
                      <Shield size={14} style={{ color: R }} /> Admin Panel
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                  </>
                )}
                <button onClick={() => { setMenuOpen(false); window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50" style={{ color: B }}>
                  <Send size={14} style={{ color: R }} /> Telegram
                </button>
                <button onClick={() => { setMenuOpen(false); window.open("https://t.me/TigerProtocolGlobal", "_blank"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50" style={{ color: B }}>
                  <Headphones size={14} style={{ color: R }} /> Customer Service
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Announcement Banner ── */}
      <AnnouncementBanner />

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

      {/* ── Airdrop Modal ── */}
      {airdropOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setAirdropOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: B }}>🎁 Airdrop</h2>
              <button onClick={() => setAirdropOpen(false)} className="p-1 rounded-lg hover:bg-gray-100" style={{ color: B }}>
                <X size={16} />
              </button>
            </div>
            {airdrops.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No active airdrops at the moment.</p>
            ) : (
              <div className="space-y-3">
                {airdrops.map(a => (
                  <div key={a.id} className="rounded-xl p-4 border border-blue-100" style={{ background: "#EFF6FF" }}>
                    <p className="text-sm font-bold mb-1" style={{ color: B }}>{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mb-2">{a.description}</p>}
                    <p className="text-xl font-extrabold" style={{ color: R }}>${Number(a.amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setAirdropOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: B }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
