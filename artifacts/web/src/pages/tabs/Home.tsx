import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign,
  Sparkles,
  RefreshCw,
  MoreVertical,
  Bell,
  Send,
  Headphones,
  Users,
  Trophy,
  FileText,
  Share2,
  ShoppingCart,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AnnouncementBanner from "../../components/AnnouncementBanner";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Profile = {
  balance: number | null;
  name: string | null;
  referral_code: string | null;
};
type UserStats = {
  dailyIncome: number;
  totalIncome: number;
  activity: number;
  bid: number;
  comprehensive: number;
  nftRate: number;
};
type TeamData = {
  level1Count: number;
  level2Count: number;
  aCount: number;
  bcCount: number;
};
type OrderData = {
  total: number;
  processing: number;
  bought: number;
  sold: number;
};
type Ann = { id: string; message: string; created_at: string };
type Airdrop = {
  id: string;
  title: string;
  description: string;
  amount: number;
};
type Member = { id?: string; user_id: string; name: string | null; level?: number; deposit?: number };

const Z_STATS: UserStats = {
  dailyIncome: 0,
  totalIncome: 0,
  activity: 0,
  bid: 0,
  comprehensive: 0,
  nftRate: 0,
};
const Z_TEAM: TeamData = {
  level1Count: 0,
  level2Count: 0,
  aCount: 0,
  bcCount: 0,
};
const Z_ORD: OrderData = { total: 0, processing: 0, bought: 0, sold: 0 };

const getNftRate = (amount: number) => {
  if (amount >= 2000) return 2.0;
  if (amount >= 500) return 1.5;
  if (amount >= 100) return 1.2;
  return 1.0;
};

const Skel = ({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} rounded bg-gray-200 animate-pulse`} />
);

export default function HomeTab() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>(Z_STATS);
  const [team, setTeam] = useState<TeamData>(Z_TEAM);
  const [orders, setOrders] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [bellOpen, setBellOpen] = useState(false);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [airdropOpen, setAirdropOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /* ── LIVE team count (direct Supabase query, no cache) ── */
  const [liveTeamCount, setLiveTeamCount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [lastReserveTime, setLastReserveTime] = useState<string | null>(null);
  const [activeTeamTab, setActiveTeamTab] = useState("all");
  const [teamListOpen, setTeamListOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    processing: 0,
    bought: 0,
    sold: 0,
  });
  const [reservePercent, setReservePercent] = useState<number>(5);
  const [isValidMember, setIsValidMember] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const fetchReservePercent = async () => {
    const { data } = await supabase
      .from("settings")
      .select("daily_reserve_percent")
      .eq("id", 1)
      .single();

    if (data) setReservePercent(data.daily_reserve_percent);
  };
  const fetchUserData = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profileData }: any = await supabase
    .from('profiles')
    .select('balance,daily_income,total_income,last_daily_reserve,' +
            'referral_code,level1_count,level2_count,a_count,bc_count,' +
            'is_valid_member,user_level')
    .eq('user_id', user.id)
    .single();

  if (profileData) {
    setBalance(profileData.balance ?? 0);
    setDailyIncome(profileData.daily_income ?? 0);
    setTotalIncome(profileData.total_income ?? 0);
    setLastReserveTime(profileData.last_daily_reserve);
    setIsValidMember(profileData.is_valid_member ?? false);
    setProfile(profileData);

    setTeam({
      level1Count: profileData.level1_count ?? 0,
      level2Count: profileData.level2_count ?? 0,
      aCount: profileData.a_count ?? 0,
      bcCount: profileData.bc_count ?? 0,
    });
  }
};
  
const handleDailyReserve = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("User not found");
    return;
  }
  const userId = user.id;
    // 1. SUPABASE SE DATA FETCH KARO - daily_income, total_income add kiya
    const { data: userData, error: fetchError } = await supabase
      .from("profiles")
      .select("last_daily_reserve, balance, daily_income, total_income, user_level, is_valid_member")
      .eq("user_id", userId)
      .single();

    if (fetchError || !userData) {
      toast.error("Error fetching user data");
      return;
    }

    if (!userData.is_valid_member) {
      toast.error("You are not a valid member. Deposit first to activate Daily Reserve.");
      return;
    }

    // 2. PAKISTAN 5AM RESET CHECK KARO
    const now = new Date();

    // Pakistan ka current time nikalo - UTC+5
    const nowPKT = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    // Aaj ka 5AM PKT nikalo
    const today5AM_PKT = new Date(nowPKT);
    today5AM_PKT.setHours(5, 0, 0, 0);

    // Agar abhi 5AM se pehle hai to kal ka 5AM reset time hai
    const lastResetTime_PKT =
      nowPKT.getHours() < 5
        ? new Date(today5AM_PKT.getTime() - 24 * 60 * 60 * 1000) // Kal 5AM
        : today5AM_PKT; // Aaj 5AM

    // UTC mein convert karo DB ke liye
    const lastResetTime_UTC = new Date(
      lastResetTime_PKT.getTime() - 5 * 60 * 60 * 1000,
    );

    if (userData.last_daily_reserve) {
      const lastClick = new Date(userData.last_daily_reserve);

      // Agar last claim reset time ke baad hua hai to block karo
      if (lastClick >= lastResetTime_UTC) {
        const nextReset_PKT = new Date(
          today5AM_PKT.getTime() +
            (nowPKT.getHours() < 5 ? 0 : 24 * 60 * 60 * 1000),
        );
        const diffMs = nextReset_PKT.getTime() - nowPKT.getTime();

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const timeLeft = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        toast.error(`Next Reserve Wait For ${timeLeft}`);
        return;
    }

    // 3. BALANCE CHECK
    const currentBalance = userData.balance || 0;
    if (currentBalance <= 0) {
  toast.error("Balance is 0, cannot activate reserve");
  return;
}

// ✅ LEVEL KE HISAAB SE PERCENT NIKALO
const userLevel = userData.user_level || 1;
const reservePercent = userLevel === 1 ? 1.5 : 2.2;
const earnedAmount = (currentBalance * reservePercent) / 100;

    const boughtOrder = {
      id: Date.now(),
      status: "bought",
      date: new Date().toISOString(),
      amount: earnedAmount,
    };

    const soldOrder = {
      id: Date.now() + 1,
      status: "sold",
      date: new Date().toISOString(),
      amount: earnedAmount,
    };

    // Variables pehle define karo
    const newBalance = currentBalance + earnedAmount;
    const newDailyIncome = earnedAmount; // Daily reset hoga  // ✅ SAHI
    const newTotalIncome = userData.total_income + earnedAmount;
    const nowISO = new Date().toISOString();

    // 4. SUPABASE MEIN UPDATE KARO
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        daily_income: newDailyIncome,
        total_income: newTotalIncome,
        last_daily_reserve: nowISO,
      })
      .eq("user_id", userId);

    if (updateError) {
      toast.error("Failed to update. Try again");
      return;
    }
      // Referral commission for person who activated reserve
try {
  const { error: reserveCommError } = await supabase.rpc('add_reserve_commission', { 
    reserver_id: userId, 
    reserve_amount: earnedAmount 
  })
  if (reserveCommError) console.error('Reserve commission failed:', reserveCommError);
} catch (e) {
  console.error('Reserve commission error:', e);
}
  
    // 5. FRONTEND STATE UPDATE KARO
    setOrders((prev) =>
      Array.isArray(prev)
        ? [...prev, boughtOrder, soldOrder]
        : [boughtOrder, soldOrder],
    );

    setOrderStats((prev) => ({
      ...prev,
      total: (prev?.total || 0) + 2,
      bought: (prev?.bought || 0) + 1,
      sold: (prev?.sold || 0) + 1,
    }));

    toast.success(
      `Daily Reserve ${reservePercent}% activated +$${earnedAmount.toFixed(2)}`,
    );
    //await fetchUserData();//
    // UI foran update kar
    setBalance(newBalance);
    setDailyIncome(newDailyIncome);
    setTotalIncome(newTotalIncome);
    setLastReserveTime(nowISO);
  }
};
  useEffect(() => {
    fetchUserData();
    (async () => {
      try {
        await fetchReservePercent();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const [{ data: annData }, { data: readData }] = await Promise.all([
          supabase
            .from("announcements")
            .select("id, message, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("user_notifications_read")
            .select("announcement_id")
            .eq("user_id", user.id),
        ]);
        setAnns((annData ?? []) as Ann[]);
        setReads(
          new Set(
            ((readData ?? []) as { announcement_id: string }[]).map(
              (r) => r.announcement_id,
            ),
          ),
        );
      } catch {
        /* silent */
      }
    })();
  }, []);

  type TeamApiResponse = {
    count: number;
    members: Member[];
    referral_code: string | null;
  };

  /* ── Fetch team data via Express API (service role → bypasses RLS) ── */
  const fetchTeamData =
    useCallback(async (): Promise<TeamApiResponse | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return null;
      try {
        const res = await fetch("/api/nft/auth/team", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as TeamApiResponse;
      } catch {
        return null;
      }
    }, []);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const uid = user.id;
    setUserId(uid);

    // 1. PURANA CODE - Profile + Balance - TOUCH NAHI KIYA
    const [apiUser, profileRow] = await Promise.all([
      getCurrentUser(),
      supabase
        .from("profiles")
        .select("role, referral_code, balance, total_orders")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    const profile = profileRow.data;
    setBalance(Number(profile?.balance) || 0);
    setLiveTeamCount(Number(profile?.total_orders) || 0);
    setOrderStats({
      total: Number(profile?.total_orders) || 0,
      processing: 0,
      bought: 0,
      sold: 0,
    });

    const refCode = profileRow?.data?.referral_code ?? null;

    //setProfile(apiUser? { balance: apiUser.walletBalance, name: apiUser.name, referral_code: refCode } : null);
    setIsAdmin(profileRow?.data?.role === "admin" || apiUser?.isAdmin === true);

    // ===== TEAM API HATA DI - AB DIRECT SUPABASE =====

    // LEVEL 1 - DIRECT SUPABASE
    const { data: level1Members } = await supabase
      .from("profiles")
      .select("id, name, email, referral_code, referred_by_code")
      .eq("referred_by_code", refCode);

    let level2Members: any[] = [];

    // LEVEL 2 - DIRECT SUPABASE

    const level1Safe = level1Members ?? [];
    const level1Codes = level1Safe
      .map((m: any) => m.referral_code)
      .filter(Boolean);
    // ===== DEBUG LEVEL 2 START =====

    let level3Members: any[] = [];
    if (level1Codes.length > 0) {
      const { data: level2Data, error: level2Error } = await supabase
        .from("profiles")
        .select("id, name, email, referral_code, referred_by_code")
        .in("referred_by_code", level1Codes);

      level2Members = level2Data || [];
      // ===== LEVEL 3 SHURU =====

      if (level2Members.length > 0) {
        const level3Codes = level2Members
          .map((m: any) => m.referral_code)
          .filter(Boolean);

        const { data: level3Data, error: level3Error } = await supabase
          .from("profiles")
          .select("id, name, email, referral_code, referred_by_code")
          .in("referred_by_code", level3Codes);

        level3Members = level3Data || [];
      }
      // ===== LEVEL 3 KHATAM =====
    }
    // ===== LEVEL 2 KHATAM =====

    // AB SAB SET KARO - LEVEL 1 + LEVEL 2 + LEVEL 3
    /// DEPOSIT DATA LAO - SIRF COMPLETE WALE
    const allUserIds = [
      ...level1Safe,
      ...level2Members,
      ...level3Members,
    ].map((m) => m.id);

    let depositMap = new Map();
    if (allUserIds.length > 0) {
      const { data: depositData } = await supabase
        .from("deposits")
        .select("user_id, amount")
        .in("user_id", allUserIds)
        .in("status", ["approved", "finished", "confirmed", "complete"]); // ← NOWPayments ke saare status

      depositData?.forEach((d) => {
        depositMap.set(
          d.user_id,
          (depositMap.get(d.user_id) || 0) + Number(d.amount),
        );
      });
    }

    // AB SAB SET KARO - LEVEL 1 + LEVEL 2 + LEVEL 3 WITH DEPOSIT
    const allMembers = [
      ...level1Safe.map((m) => ({
        ...m,
        level: 1,
        deposit: depositMap.get(m.id) || 0,
      })),
      ...level2Members.map((m) => ({
        ...m,
        level: 2,
        deposit: depositMap.get(m.id) || 0,
      })),
      ...level3Members.map((m) => ({
        ...m,
        level: 3,
        deposit: depositMap.get(m.id) || 0,
      })),
    ];

    setTeam({
      level1Count: level1Safe.length,
      level2Count: level2Members.length + level3Members.length,
      aCount: level1Safe.filter((m: any) => (depositMap.get(m.id) || 0) > 0).length,
      bcCount: [...level2Members, ...level3Members].filter((m: any) => (depositMap.get(m.id) || 0) > 0).length,
    });

    setTeamMembers(allMembers);
    setLiveTeamCount(allMembers.length);
    // 4. STATS - PURANA CODE SAME HAI
    const [dailyRes, { data: approvedDeposits }] = await Promise.all([
      supabase
        .from("daily_income_stats")
        .select("today_income, total_income")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("deposits")
        .select("amount")
        .eq("user_id", uid)
        .eq("status", "approved"),
    ]);
    const maxAmt = (approvedDeposits ?? []).reduce(
      (m, d) => Math.max(m, Number(d.amount)),
      0,
    );
    const nftRate = getNftRate(maxAmt);

    setStats({
      dailyIncome: dailyRes.data?.today_income ?? 0,
      totalIncome: dailyRes.data?.total_income ?? 0,
      activity: apiUser?.totalOrders ?? 0,
      bid: maxAmt,
      comprehensive: maxAmt * (nftRate / 100),
      nftRate,
    });

    setOrderStats({
      total: apiUser?.totalOrders ?? 0,
      processing: apiUser?.processingOrders ?? 0,
      bought: apiUser?.boughtCount ?? 0,
      sold: apiUser?.soldCount ?? 0,
    });

    setLoading(false);
  }, [navigate]);
  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);

    const channel = supabase
      .channel("home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deposits" },
        () => load(),
      )
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  /* ── Realtime: new announcements → refresh bell badge ── */
  useEffect(() => {
    const annChannel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        async () => {
          const { data: annData } = await supabase
            .from("announcements")
            .select("id, message, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5);
          setAnns((annData ?? []) as Ann[]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(annChannel);
    };
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markRead = async (annId: string) => {
    if (!userId || reads.has(annId)) return;
    await supabase
      .from("user_notifications_read")
      .insert({ user_id: userId, announcement_id: annId });
    setReads((prev) => new Set([...prev, annId]));
  };

  const openAirdrops = async () => {
    const { data } = await supabase
      .from("airdrops")
      .select("*")
      .eq("is_active", true);
    setAirdrops((data ?? []) as Airdrop[]);
    setAirdropOpen(true);
  };

  /* ── Toggle team member list — uses Express API (service role, no RLS) ── */
  // Toggle team member list - uses Express API (service role, no RLS) ->
  const handleTeamClick = async () => {
    if (teamListOpen) {
      setTeamListOpen(false);
      return;
    }

    setTeamListOpen(true);
    setActiveTeamTab("all"); // ← YE LINE ADD KI
    setTeamMembersLoading(true);
    setTeamMembers([]);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setTeamMembersLoading(false); return; }
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("referral_code, balance, total_orders, user_level, daily_income")
      .eq("user_id", user.id)
      .single();
    setBalance(Number(myProfile?.balance) || 0);
    //setLiveTeamCount(Number(myProfile?.total_orders) || 0);
    if (!myProfile?.referral_code) {
      setTeamMembersLoading(false);
      return;
    }

    const { data: l1 } = await supabase
      .from("profiles")
      .select("id, name, email, referral_code")
      .eq("referred_by_code", myProfile.referral_code);

    const l1Codes = (l1 || []).map((u) => u.referral_code).filter(Boolean);
    let l2: { id: string; name: string | null; email: string | null }[] = [];
    if (l1Codes.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("referred_by_code", l1Codes);
      l2 = data || [];
    }

    setTeamMembers(
      [...(l1 || []), ...l2].map((m) => ({ user_id: m.id, name: m.name })),
    );
    // ✅ LEVEL 2+ KO REAL TEAM COMMISSION DIKHAYO
const myUserLevel = myProfile?.user_level || 1;
const realTeamCommission = myUserLevel >= 2 ? myProfile?.daily_income || 0 : 0;
setLiveTeamCount(realTeamCommission); // ✅ AB COMMISSION DIKHEGI
    setTeamMembersLoading(false);
  };

  /* ── LOADING SKELETON ── */
  if (loading) {
    return (
      <div
        className="max-w-md mx-auto px-3 pt-3 pb-2"
        style={{ background: BG, minHeight: "100vh" }}
      >
        <div className="flex items-center justify-between h-14 mb-2">
          <div className="flex items-center gap-2">
            <Skel h="h-8" w="w-8" />
            <Skel h="h-5" w="w-24" />
          </div>
          <Skel h="h-8" w="w-8" />
        </div>
        <div
          className="rounded-2xl p-3 mb-2 space-y-1.5"
          style={{ background: "#c7d2e7" }}
        >
          <Skel h="h-3" w="w-20" />
          <Skel h="h-8" w="w-32" />
          <Skel h="h-3" w="w-10" />
        </div>
        <div className="rounded-xl p-3 mb-2 bg-green-50 border border-green-200 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skel h="h-3" w="w-24" />
              <Skel h="h-3" w="w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 mb-2">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} h="h-16" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 mb-2">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} h="h-16" />
            ))}
          </div>
        </div>
        <Skel h="h-9" w="w-full" />
      </div>
    );
  }
  console.log("TEAM DATA:", team);
  console.log("STATS DATA:", stats);
  const statsRows = [
    {
      label: "Daily Income",
      value: `${stats.dailyIncome.toFixed(2)}`,
      hl: true,
    },
    {
      label: "Total Income",
      value: `${stats.totalIncome.toFixed(2)}`,
      hl: true,
    },
    
    { label: "Team Income %", value: `$0.00`, hl: true },
    { label: "Activity", value: String(stats.activity), hl: false },
  ];

  const otherTeamBoxes = [
    {
      label: ["Total Register B/C", "Members"],
      value: team.level2Count ?? 0,
      icon: (
        <Trophy className="w-5 h-5 mx-auto mt-1" style={{ color: "#ea580c" }} />
      ),
      key: "level2",
      onClick: () => {
        setTeamListOpen(true);
        setActiveTeamTab("level2");
      },
    },
    {
      label: ["A", "Enthusiast"],
      value: team.aCount ?? 0,
      icon: (
        <FileText
          className="w-5 h-5 mx-auto mt-1"
          style={{ color: "#3b82f6" }}
        />
      ),
      key: "aEnthusiast",
      onClick: () => {
        setTeamListOpen(true);
        setActiveTeamTab("aEnthusiast");
      },
    },
    {
      label: ["B/C", "Enthusiast"],
      value: team.bcCount ?? 0,
      icon: (
        <Share2 className="w-5 h-5 mx-auto mt-1" style={{ color: "#22c55e" }} />
      ),
      key: "bcEnthusiast",
      onClick: () => {
        setTeamListOpen(true);
        setActiveTeamTab("bcEnthusiast");
      },
    },
  ];

  const orderBoxes = [
    {
      label: "Orders",
      value: orderStats.total,
      icon: (
        <ShoppingCart
          className="w-5 h-5 mx-auto mt-1"
          style={{ color: "#3b82f6" }}
        />
      ),
    },
    {
      label: "Processing",
      value: orderStats.processing,
      icon: (
        <Clock className="w-5 h-5 mx-auto mt-1" style={{ color: "#eab308" }} />
      ),
    },
    {
      label: "Bought",
      value: orderStats.bought,
      icon: (
        <ArrowDownCircle
          className="w-5 h-5 mx-auto mt-1"
          style={{ color: "#22c55e" }}
        />
      ),
    },
    {
      label: "Sold",
      value: orderStats.sold,
      icon: (
        <ArrowUpCircle className="w-5 h-5 mx-auto mt-1" style={{ color: R }} />
      ),
    },
  ];

  return (
    <div
      className="max-w-md mx-auto px-3 pt-3 pb-2"
      style={{ background: BG, minHeight: "100vh" }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#fff", color: B, border: "1px solid #e5e7eb" },
        }}
      />

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
              onClick={() => setBellOpen((v) => !v)}
              className="relative p-1.5 rounded-xl hover:bg-white transition-colors"
              style={{ color: B }}
            >
              <Bell size={18} />
              {anns.some((a) => !reads.has(a.id)) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 w-72 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: B }}>
                    Notifications
                  </p>
                  {anns.some((a) => !reads.has(a.id)) && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                      style={{ background: R }}
                    >
                      {anns.filter((a) => !reads.has(a.id)).length} new
                    </span>
                  )}
                </div>
                {anns.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No announcements
                  </p>
                ) : (
                  anns.map((ann) => (
                    <button
                      key={ann.id}
                      onClick={() => {
                        markRead(ann.id);
                        setBellOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors${reads.has(ann.id) ? " opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!reads.has(ann.id) && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {ann.message}
                        </p>
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
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-xl hover:bg-white transition-colors"
              style={{ color: B }}
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-50">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/admin");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-red-50"
                      style={{ color: R }}
                    >
                      <Shield size={14} style={{ color: R }} /> Admin Panel
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                  </>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50"
                  style={{ color: B }}
                >
                  <Send size={14} style={{ color: R }} /> Telegram
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.open("https://t.me/TigerProtocolGlobal", "_blank");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium hover:bg-gray-50"
                  style={{ color: B }}
                >
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
      <div
        className="rounded-2xl p-3 mb-2 relative overflow-hidden"
        style={{ background: B }}
      >
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 bg-white -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-1 opacity-70">
            <DollarSign size={12} className="text-white" />
            <p className="text-xs font-medium text-white">Wallet Balance</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white leading-tight">
            ${balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-white opacity-50 mt-0.5">USDT</p>
        </div>
      </div>

      {/* ══ SECTION 1 — STATS TABLE ══ */}
      <div className="rounded-xl mb-2 overflow-hidden border border-green-200 bg-green-50">
        {statsRows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-1.5"
            style={{
              borderBottom:
                i < statsRows.length - 1 ? "1px solid #bbf7d0" : "none",
            }}
          >
            <span className="text-xs text-gray-600 leading-tight">
              {row.label}
            </span>
            <span
              className="text-sm font-bold leading-tight"
              style={{ color: row.hl ? R : "#166534" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* ══ SECTION 2 — MY TEAM ══ */}
      <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
        <p className="text-xs font-bold mb-2" style={{ color: B }}>
          My Team
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {/* ── Total Register Members — CLICKABLE, live from profiles ── */}
          <button
            onClick={handleTeamClick}
            className="flex flex-col items-center text-center focus:outline-none active:opacity-70 transition-opacity"
          >
            <Users
              className="w-5 h-5 mx-auto mt-1"
              style={{ color: "#3b82f6" }}
            />
            <p
              className="text-base font-bold leading-tight mt-0.5"
              style={{ color: liveTeamCount === 0 ? R : "#111827" }}
            >
              {liveTeamCount}
            </p>
            <p className="text-[9px] text-gray-500 leading-tight">
              Total Register
              <br />
              Members
            </p>
            <span
              className="flex items-center gap-0.5 mt-0.5 text-[8px] font-semibold"
              style={{ color: B }}
            >
              {teamListOpen ? (
                <>
                  <ChevronUp size={9} />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown size={9} />
                  Details
                </>
              )}
            </span>
          </button>

          {/* Other team boxes */}
          {otherTeamBoxes.map((box) => (
            <button
              key={box.key}
              className="flex flex-col items-center text-center cursor-pointer active:scale-95 focus:outline-none"
              onClick={box.onClick}
            >
              {box.icon}
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: box.value === 0 ? R : "#111827" }}
              >
                {box.value}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                {box.label[0]}
                <br />
                {box.label[1]}
              </p>
              <span
                className="flex items-center gap-0.5 mt-0.5 text-[8px] font-semibold"
                style={{ color: B }}
              >
                {teamListOpen && activeTeamTab === box.key ? (
                  <>
                    <ChevronUp size={9} />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown size={9} />
                    Details
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* --- Expandable member list --- */}
        {teamListOpen && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            {teamMembersLoading ? (
              <div className="flex items-center justify-center py-5">
                <RefreshCw
                  size={14}
                  className="animate-spin"
                  style={{ color: B }}
                />
                <span className="ml-2 text-xs text-gray-400">
                  Loading members...
                </span>
              </div>
            ) : (
              <>
                {(() => {
                  let filteredMembers: Member[] = [];
                  let title = "";

                  if (activeTeamTab === "all") {
                    filteredMembers = teamMembers.filter((m) => m.level === 1);
                    title = `Level 1 Members (${filteredMembers.length})`;
                  } else if (activeTeamTab === "level2") {
                    filteredMembers = teamMembers.filter((m) => (m.level ?? 0) >= 2);
                    title = `B/C Members - Level 2 & 3 (${filteredMembers.length})`;
                  } else if (activeTeamTab === "aCount") {
                    filteredMembers = teamMembers.filter(
                      (m) => m.level === 1 && (m.deposit ?? 0) > 0,
                    );
                    title = `A Enthusiast (${filteredMembers.length})`;
                  } else if (activeTeamTab === "bcCount") {
                    filteredMembers = teamMembers.filter(
                      (m) => (m.level ?? 0) >= 2 && (m.deposit ?? 0) > 0,
                    );
                    title = `B/C Enthusiast (${filteredMembers.length})`;
                  }

                  return (
                    <>
                      <p className="text-xs font-bold text-gray-700 mb-2">
                        {title}
                      </p>
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No members yet
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-">
                            <thead>
                              <tr style={{ background: "#EFF6FF" }}>
                                <th
                                  className="text-left py-1.5 px-2 font-semibold"
                                  style={{ color: B }}
                                >
                                  User ID
                                </th>
                                <th
                                  className="text-left py-1.5 px-2 font-semibold"
                                  style={{ color: B }}
                                >
                                  Name
                                </th>
                                <th
                                  className="text-left py-1.5 px-2 font-semibold"
                                  style={{ color: B }}
                                >
                                  Level
                                </th>
                                <th
                                  className="text-left py-1.5 px-2 font-semibold"
                                  style={{ color: B }}
                                >
                                  Deposit
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredMembers.map((m, idx) => (
                                <tr
                                  key={m.id ?? idx}
                                  className="border-t border-gray-50"
                                  style={{
                                    background:
                                      idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                                  }}
                                >
                                  <td className="py-1.5 px-2 font-mono text-gray-500">
                                    {m.id?.slice(0, 8) ?? "N/A"}...
                                  </td>
                                  <td
                                    className="py-1.5 px-2 font-medium"
                                    style={{ color: "#111827" }}
                                  >
                                    {m.name || "-"}
                                  </td>
                                  <td
                                    className="py-1.5 px-2 font-medium"
                                    style={{
                                      color:
                                        m.level === 1
                                          ? "#3b82f6"
                                          : m.level === 2
                                            ? "#ea580c"
                                            : "#9333ea",
                                    }}
                                  >
                                    Level {m.level}
                                  </td>
                                  <td
                                    className="py-1.5 px-2 font-medium"
                                    style={{
                                      color:
                                        (m.deposit ?? 0) > 0 ? "#16a34a" : "#ef4444",
                                    }}
                                  >
                                    {(m.deposit ?? 0) > 0
                                      ? `$${m.deposit}`
                                      : "No Deposit"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            <button
              onClick={() => setTeamListOpen(false)}
              className="mt-2 w-full flex items-center justify-center gap-1 text- font-bold py-1.5 rounded-lg transition-colors hover:opacity-80"
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
          <p className="text-xs font-bold" style={{ color: B }}>
            My Orders
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="text-[10px] font-semibold"
            style={{ color: R }}
          >
            Check Orders &gt;
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {orderBoxes.map((box) => (
            <div
              key={box.label}
              className="flex flex-col items-center text-center"
            >
              {box.icon}
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: box.value === 0 ? R : "#111827" }}
              >
                {box.value}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                {box.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECTION 4 — CLAIM PROFIT ══ */}
      {isValidMember === false && (
        <p className="text-center text-xs mb-1" style={{ color: R }}>
          Deposit to activate Daily Reserve
        </p>
      )}
      <button
        onClick={handleDailyReserve}
        disabled={claiming || isValidMember === false}
        className="w-full flex items-center justify-center gap-2 font-bold text-sm rounded-xl h-9 text-white transition-all active:scale-95 disabled:opacity-60"
        style={{ background: claiming ? "#b91c1c" : R }}
        onMouseEnter={(e) =>
          !claiming && isValidMember !== false &&
          ((e.currentTarget as HTMLElement).style.background = "#b91c1c")
        }
        onMouseLeave={(e) =>
          !claiming && isValidMember !== false &&
          ((e.currentTarget as HTMLElement).style.background = R)
        }
      >
        {claiming ? (
          <>
            <RefreshCw size={14} className="animate-spin" /> Claiming...
          </>
        ) : (
          <>
            <Sparkles size={14} /> Daily Reserve
          </>
        )}
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
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: B }}>
                🎁 Airdrop
              </h2>
              <button
                onClick={() => setAirdropOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
                style={{ color: B }}
              >
                <X size={16} />
              </button>
            </div>
            {airdrops.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No active airdrops at the moment.
              </p>
            ) : (
              <div className="space-y-3">
                {airdrops.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl p-4 border border-blue-100"
                    style={{ background: "#EFF6FF" }}
                  >
                    <p className="text-sm font-bold mb-1" style={{ color: B }}>
                      {a.title}
                    </p>
                    {a.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {a.description}
                      </p>
                    )}
                    <p className="text-xl font-extrabold" style={{ color: R }}>
                      ${Number(a.amount).toFixed(2)}
                    </p>
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