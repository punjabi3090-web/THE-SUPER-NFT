import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign, Sparkles, RefreshCw, MoreVertical, Bell, Send, Headphones,
  Users, Trophy, FileText, Share2, ShoppingCart, Clock,
  ArrowDownCircle, ArrowUpCircle, X, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import AnnouncementBanner from "../../components/AnnouncementBanner";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Profile   = { balance: number | null; name: string | null; referral_code: string | null };
type UserStats = { dailyIncome: number; totalIncome: number; activity: number; bid: number; comprehensive: number; nftRate: number };
type TeamData  = { valid: number; aEnthusiast: number; bcEnthusiast: number };
type OrderData = { total: number; processing: number; bought: number; sold: number };
type Ann       = { id: string; message: string; created_at: string };
type Airdrop   = { id: string; title: string; description: string; amount: number };
type Member    = { user_id: string; name: string | null };

const Z_STATS: UserStats = { dailyIncome: 0, totalIncome: 0, activity: 0, bid: 0, comprehensive: 0, nftRate: 0 };
const Z_TEAM: TeamData   = { valid: 0, aEnthusiast: 0, bcEnthusiast: 0 };
const Z_ORD: OrderData   = { total: 0, processing: 0, bought: 0, sold: 0 };

const getNftRate = (amount: number) => {
  if (amount >= 2000) return 2.0;
  if (amount >= 500)  return 1.5;
  if (amount >= 100)  return 1.2;
  return 1.0;
};

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
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [anns,        setAnns]        = useState<Ann[]>([]);
  const [reads,       setReads]       = useState<Set<string>>(new Set());
  const [bellOpen,    setBellOpen]    = useState(false);
  const [airdrops,    setAirdrops]    = useState<Airdrop[]>([]);
  const [airdropOpen, setAirdropOpen] = useState(false);
  const [userId,      setUserId]      = useState<string | null>(null);

  /* ── LIVE team count (direct Supabase query, no cache) ── */
  const [liveTeamCount,      setLiveTeamCount]      = useState<number>(0);
  const [teamListOpen,       setTeamListOpen]       = useState(false);
  const [teamMembers,        setTeamMembers]        = useState<Member[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  /* ── Announcements — runs once on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const [{ data: annData }, { data: readData }] = await Promise.all([
          supabase.from("announcements")
            .select("id, message, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("user_notifications_read")
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

  type TeamApiResponse = { count: number; members: Member[]; referral_code: string | null };

  /* ── Fetch team data via Express API (service role → bypasses RLS) ── */
  const fetchTeamData = useCallback(async (): Promise<TeamApiResponse | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    try {
      const res = await fetch("/api/nft/auth/team", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json() as TeamApiResponse;
    } catch { return null; }
  }, []);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    const uid = user.id;

    /* Express API: balances + team data — run in parallel */
    const [apiUser, teamData] = await Promise.all([
      getCurrentUser(),
      fetchTeamData(),
    ]);

    const refCode = teamData?.referral_code ?? apiUser?.myReferralCode ?? null;
    setProfile(apiUser ? { balance: apiUser.walletBalance, name: apiUser.name, referral_code: refCode } : null);
    setIsAdmin(apiUser?.isAdmin ?? false);

    /* Team count from service-role API (correct source — no RLS, no cache) */
    setLiveTeamCount(teamData?.count ?? 0);

    /* Daily income + approved deposits from Supabase */
    const [dailyRes, { data: approvedDeps }] = await Promise.all([
      supabase.from("daily_income_stats").select("today_income, total_income").eq("user_id", uid).maybeSingle(),
      supabase.from("deposits").select("amount").eq("user_id", uid).eq("status", "approved"),
    ]);

    const comprehensive = (approvedDeps ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
    const maxAmt = (approvedDeps ?? []).reduce((m, d) => Math.max(m, Number(d.amount)), 0);
    const nftRate = getNftRate(maxAmt);

    setStats({
      dailyIncome:  dailyRes.data?.today_income ?? 0,
      totalIncome:  dailyRes.data?.total_income ?? 0,
      activity:     apiUser?.totalOrders  ?? 0,
      bid:          maxAmt,
      comprehensive,
      nftRate,
    });

    setTeam({
      valid:        apiUser?.validMembers  ?? 0,
      aEnthusiast:  apiUser?.aEnthusiasts  ?? 0,
      bcEnthusiast: apiUser?.bcEnthusiasts ?? 0,
    });

    setOrders({
      total:      apiUser?.totalOrders      ?? 0,
      processing: apiUser?.processingOrders ?? 0,
      bought:     apiUser?.boughtCount      ?? 0,
      sold:       apiUser?.soldCount        ?? 0,
    });

    setLoading(false);
  }, [navigate, fetchTeamData]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);

    const channel = supabase.channel("home-realtime")
      .on("postgres_changes", { event: "*",    schema: "public", table: "profiles" },     () => load())
      .on("postgres_changes", { event: "*",    schema: "public", table: "transactions" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deposits" },  () => load())
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  /* ── Realtime: new announcements → refresh bell badge ── */
  useEffect(() => {
    const annChannel = supabase.channel("announcements-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, async () => {
        const { data: annData } = await supabase
          .from("announcements").select("id, message, created_at")
          .eq("is_active", true).order("created_at", { ascending: false }).limit(5);
        setAnns((annData ?? []) as Ann[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(annChannel); };
  }, []);

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
    await supabase.from("user_notifications_read").insert({ user_id: userId, announcement_id: annId });
    setReads(prev => new Set([...prev, annId]));
  };

  const openAirdrops = async () => {
    const { data } = await supabase.from("airdrops").select("*").eq("is_active", true);
    setAirdrops((data ?? []) as Airdrop[]);
    setAirdropOpen(true);
  };

  /* ── Toggle team member list — uses Express API (service role, no RLS) ── */
  const handleTeamClick = async () => {
    if (teamListOpen) { setTeamListOpen(false); return; }

    setTeamListOpen(true);
    setTeamMembersLoading(true);
    setTeamMembers([]);

    const data = await fetchTeamData();
    if (data) {
      setTeamMembers(data.members ?? []);
      setLiveTeamCount(data.count);
    }
    setTeamMembersLoading(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setClaiming(false); return; }

    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_income")
      .select("id, status, amount")
      .eq("user_id", user.id)
      .eq("income_date", today)
      .maybeSingle();

    if (existing?.status === "claimed") {
      toast("Already claimed today! Come back tomorrow. ⏳", { icon: "ℹ️" });
      setClaiming(false);
      return;
    }

    if (existing?.status === "pending") {
      const { error } = await supabase
        .from("daily_income")
        .update({ status: "claimed" })
        .eq("id", existing.id);
      if (error) { toast.error("Failed: " + error.message); }
      else { toast.success(`Claimed $${Number(existing.amount).toFixed(2)} ✓`); load(); }
      setClaiming(false);
      return;
    }

    const { data: deps, error: depsErr } = await supabase
      .from("deposits")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "approved");

    if (depsErr) { toast.error("Failed to fetch deposits: " + depsErr.message); setClaiming(false); return; }
    if (!deps || deps.length === 0) {
      toast("No active deposit. Make a deposit first.", { icon: "ℹ️" });
      setClaiming(false);
      return;
    }

    const totalIncome = deps.reduce((sum, d) => {
      const amt = Number(d.amount);
      return sum + amt * (getNftRate(amt) / 100);
    }, 0);

    if (totalIncome <= 0) {
      toast("No income to claim.", { icon: "ℹ️" });
      setClaiming(false);
      return;
    }

    const { error: insErr } = await supabase.from("daily_income").insert({
      user_id:     user.id,
      amount:      totalIncome,
      status:      "claimed",
      income_date: today,
    });

    if (insErr) { toast.error("Failed: " + insErr.message); }
    else { toast.success(`Claimed $${totalIncome.toFixed(2)} ✓`); load(); }
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
          {Array.from({ length: 6 }).map((_, i) => (
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
    { label: "Daily Income",  value: `$${stats.dailyIncome.toFixed(2)}`,                                       hl: true  },
    { label: "Total Income",  value: `$${stats.totalIncome.toFixed(2)}`,                                       hl: true  },
    { label: "Comprehensive", value: stats.comprehensive > 0 ? `$${stats.comprehensive.toFixed(2)}` : "—",     hl: false },
    { label: "Claim",         value: stats.nftRate > 0 ? `${stats.nftRate}%` : "—",                           hl: false },
    { label: "Team",          value: String(liveTeamCount),                                                    hl: false },
    { label: "Activity",      value: String(stats.activity),                                                   hl: false },
    { label: "Bid",           value: stats.bid > 0 ? `$${stats.bid.toFixed(2)}` : "—",                        hl: false },
  ];

  const otherTeamBoxes = [
    { label: ["Valid",   "Members"],    value: team.valid,        icon: <Trophy   className="w-5 h-5 mx-auto mt-1" style={{ color: "#eab308" }} /> },
    { label: ["A",       "Enthusiast"], value: team.aEnthusiast,  icon: <FileText className="w-5 h-5 mx-auto mt-1" style={{ color: "#3b82f6" }} /> },
    { label: ["B+C",     "Enthusiast"], value: team.bcEnthusiast, icon: <Share2   className="w-5 h-5 mx-auto mt-1" style={{ color: "#22c55e" }} /> },
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

          {/* Bell */}
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

          {/* Airdrop */}
          <button
            onClick={openAirdrops}
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ color: B, background: "#EFF6FF" }}
          >
            Airdrop
          </button>

          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 rounded-xl hover:bg-white transition-colors" style={{ color: B }}>
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-50">
                {isAdmin && (
                  <>
                    <button onClick={() => { setMenuOpen(false); navigate("/admin"); }}
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

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Balance Card */}
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

      {/* ══ SECTION 1 — STATS TABLE ══ */}
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

          {/* ── Total Register Members — CLICKABLE, live from profiles ── */}
          <button
            onClick={handleTeamClick}
            className="flex flex-col items-center text-center focus:outline-none active:opacity-70 transition-opacity"
          >
            <Users className="w-5 h-5 mx-auto mt-1" style={{ color: "#3b82f6" }} />
            <p
              className="text-base font-bold leading-tight mt-0.5"
              style={{ color: liveTeamCount === 0 ? R : "#111827" }}
            >
              {liveTeamCount}
            </p>
            <p className="text-[9px] text-gray-500 leading-tight">Total Register<br />Members</p>
            <span className="flex items-center gap-0.5 mt-0.5 text-[8px] font-semibold" style={{ color: B }}>
              {teamListOpen
                ? <><ChevronUp size={9} />Hide</>
                : <><ChevronDown size={9} />Details</>
              }
            </span>
          </button>

          {/* Other team boxes */}
          {otherTeamBoxes.map(box => (
            <div key={box.label[0]} className="flex flex-col items-center text-center">
              {box.icon}
              <p className="text-base font-bold leading-tight mt-0.5" style={{ color: box.value === 0 ? R : "#111827" }}>{box.value}</p>
              <p className="text-[9px] text-gray-500 leading-tight">{box.label[0]}<br />{box.label[1]}</p>
            </div>
          ))}
        </div>

        {/* ── Expandable member list ── */}
        {teamListOpen && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            {teamMembersLoading ? (
              <div className="flex items-center justify-center py-5">
                <RefreshCw size={14} className="animate-spin" style={{ color: B }} />
                <span className="ml-2 text-xs text-gray-400">Loading members...</span>
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No members yet</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr style={{ background: "#EFF6FF" }}>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: B }}>User ID</th>
                      <th className="text-left py-1.5 px-2 font-semibold" style={{ color: B }}>User Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m, idx) => (
                      <tr
                        key={m.user_id}
                        className="border-t border-gray-50"
                        style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                      >
                        <td className="py-1.5 px-2 font-mono text-gray-500">
                          {m.user_id.slice(0, 8)}…
                        </td>
                        <td className="py-1.5 px-2 font-medium" style={{ color: "#111827" }}>
                          {m.name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => setTeamListOpen(false)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ color: B, background: "#EFF6FF" }}
            >
              <ChevronUp size={10} /> Hide
            </button>
          </div>
        )}
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
              <p className="text-base font-bold leading-tight mt-0.5" style={{ color: box.value === 0 ? R : "#111827" }}>{box.value}</p>
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
        {claiming ? <><RefreshCw size={14} className="animate-spin" /> Claiming...</> : <><Sparkles size={14} /> Daily Reserve</>}
      </button>

      {/* Airdrop Modal */}
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
