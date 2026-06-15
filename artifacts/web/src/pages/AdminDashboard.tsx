import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield, RefreshCw, Search, DollarSign, Users, BarChart3,
  Megaphone, Settings, ArrowDownToLine, Check, X, ArrowLeft,
  ExternalLink, Edit2, Clock,
} from "lucide-react";

/* ─── Brand ─── */
const R = "#DC2626";
const B = "#1E3A8A";
const G = "#16a34a";
const Y = "#D97706";

type Tab = "deposits" | "withdrawals" | "users" | "settings" | "announce" | "stats";

/* ─── Types ─── */
type DepositRow = {
  id: string; amount: number; tx_hash: string | null;
  screenshot_url: string | null; status: string;
  created_at: string; user_id: string;
  profiles: { email: string | null; name: string | null } | null;
};
type WithdrawalRow = {
  id: string; amount: number; wallet_address: string | null;
  network: string | null; status: string; created_at: string; user_id: string;
  profiles: { email: string | null; name: string | null } | null;
};
type UserRow = {
  id: string; user_id: string | null; email: string | null; name: string | null;
  balance: number | null; total_deposit: number | null;
  total_withdrawn: number | null; referral_code: string | null;
  created_at: string | null; role: string | null;
};
type AdminSettings = {
  bep20_address: string; trc20_address: string;
  deposit_reward_percent: string; referral_reward_percent: string;
  level_reward_percent: string; airdrop_percent: string;
  withdrawal_min_hours: string; withdrawal_max_hours: string;
  min_withdraw: string; max_withdraw: string;
  telegram_link: string; customer_service_link: string;
};
type Stats = {
  totalUsers: number; totalDeposits: number;
  pendingDeposits: number; pendingWithdrawals: number;
  totalWithdrawn: number;
  usersBalance: number; totalDepositedSum: number; totalWithdrawnSum: number;
};

const DEFAULT_SETTINGS: AdminSettings = {
  bep20_address: "", trc20_address: "",
  deposit_reward_percent: "0", referral_reward_percent: "10",
  level_reward_percent: "5", airdrop_percent: "0",
  withdrawal_min_hours: "24", withdrawal_max_hours: "72",
  min_withdraw: "10", max_withdraw: "10000",
  telegram_link: "https://t.me/+uE-PlUgGg-wzOWRk",
  customer_service_link: "https://t.me/TigerProtocolGlobal",
};
const ZERO_STATS: Stats = { totalUsers: 0, totalDeposits: 0, pendingDeposits: 0, pendingWithdrawals: 0, totalWithdrawn: 0, usersBalance: 0, totalDepositedSum: 0, totalWithdrawnSum: 0 };

/* ─── Small helpers ─── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, [string, string]> = {
    pending:  ["#FEF9C3", "#854D0E"],
    approved: ["#DCFCE7", "#166534"],
    rejected: ["#FEE2E2", "#991B1B"],
  };
  const [bg, color] = cfg[status] ?? ["#F3F4F6", "#374151"];
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: bg, color }}>{status}</span>;
}

function Btn({
  color = "blue", size = "md", disabled, onClick, children,
}: {
  color?: "blue"|"green"|"red"|"gray"|"yellow";
  size?: "sm"|"md"; disabled?: boolean;
  onClick: () => void; children: React.ReactNode;
}) {
  const bg = { blue: B, green: G, red: R, gray: "#6B7280", yellow: Y }[color];
  const cls = size === "sm"
    ? "text-[10px] px-2 py-1 gap-1"
    : "text-xs px-3 py-1.5 gap-1.5";
  return (
    <button disabled={disabled} onClick={onClick}
      className={`flex items-center font-bold rounded-lg text-white disabled:opacity-40 transition-all active:scale-95 ${cls}`}
      style={{ background: bg }}>
      {children}
    </button>
  );
}

const inp = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-gray-800 placeholder-gray-300";

/* ═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ── Auth ── */
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [authDone,   setAuthDone]   = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState<Tab>("deposits");

  /* ── Data ── */
  const [deposits,    setDeposits]    = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [users,       setUsers]       = useState<UserRow[]>([]);
  const [settings,    setSettings]    = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [stats,       setStats]       = useState<Stats>(ZERO_STATS);
  const [pendingDepCount,  setPendingDepCount]  = useState(0);
  const [pendingWdCount,   setPendingWdCount]   = useState(0);

  /* ── UI state ── */
  const [busy,        setBusy]       = useState<Record<string, boolean>>({});
  const [loading,     setLoading]    = useState(false);
  const [userSearch,  setUserSearch] = useState("");
  const [balModal,    setBalModal]   = useState<{ user: UserRow; amount: string } | null>(null);
  const [txInputs,    setTxInputs]   = useState<Record<string, string>>({});
  const [rejectMsgs,  setRejectMsgs] = useState<Record<string, string>>({});
  const [announce,    setAnnounce]   = useState("");
  const [savingSet,   setSavingSet]  = useState(false);
  const [posting,     setPosting]    = useState(false);

  /* ── Admin guard ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { navigate("/", { replace: true }); return; }
      const isOwner = user.email === "faisalnft55@gmail.com";
      if (!isOwner) { navigate("/", { replace: true }); return; }
      setIsAdmin(true);
      setAdminEmail(user.email);
      setAuthDone(true);
    })();
  }, [navigate]);

  /* ── Pending badge counts ── */
  const refreshBadges = useCallback(async () => {
    const [{ count: dc }, { count: wc }] = await Promise.all([
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setPendingDepCount(dc ?? 0);
    setPendingWdCount(wc ?? 0);
  }, []);

  /* ─── Loaders per tab ─── */
  const loadDeposits = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deposits")
      .select("id, amount, tx_hash, screenshot_url, status, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data ?? [];
    const uids = [...new Set(rows.map((r: { user_id: string }) => r.user_id).filter(Boolean))];
    let profMap: Record<string, { email: string | null; name: string | null }> = {};
    if (uids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, email, name").in("user_id", uids);
      (profs ?? []).forEach((p: { user_id: string; email: string | null; name: string | null }) => { profMap[p.user_id] = { email: p.email, name: p.name }; });
    }
    setDeposits(rows.map((r: { id: string; amount: number; tx_hash: string | null; screenshot_url: string | null; status: string; created_at: string; user_id: string }) => ({ ...r, profiles: profMap[r.user_id] ?? null })));
    setLoading(false);
    refreshBadges();
  }, [refreshBadges]);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("withdrawals")
      .select("id, amount, wallet_address, network, status, created_at, user_id")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data ?? [];
    const uids = [...new Set(rows.map((r: { user_id: string }) => r.user_id).filter(Boolean))];
    let profMap: Record<string, { email: string | null; name: string | null }> = {};
    if (uids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, email, name").in("user_id", uids);
      (profs ?? []).forEach((p: { user_id: string; email: string | null; name: string | null }) => { profMap[p.user_id] = { email: p.email, name: p.name }; });
    }
    setWithdrawals(rows.map((r: { id: string; amount: number; wallet_address: string | null; network: string | null; status: string; created_at: string; user_id: string }) => ({ ...r, profiles: profMap[r.user_id] ?? null })));
    setLoading(false);
    refreshBadges();
  }, [refreshBadges]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, name, balance, total_deposit, referral_code, created_at, role")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setUsers((data ?? []) as UserRow[]);
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value ?? ""; });
      setSettings(prev => ({ ...prev, ...map }));
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [
      { count: totalUsers },
      { data: depApproved },
      { count: pendingDeps },
      { count: pendingWds },
      { data: wdApproved },
      { data: profData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("deposits").select("amount").eq("status", "approved"),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("amount").eq("status", "approved"),
      supabase.from("profiles").select("balance, total_deposit, total_withdrawn"),
    ]);
    setStats({
      totalUsers:        totalUsers ?? 0,
      totalDeposits:     (depApproved ?? []).reduce((s, r) => s + (r.amount ?? 0), 0),
      pendingDeposits:   pendingDeps ?? 0,
      pendingWithdrawals: pendingWds ?? 0,
      totalWithdrawn:    (wdApproved ?? []).reduce((s, r) => s + (r.amount ?? 0), 0),
      usersBalance:      (profData ?? []).reduce((s, r) => s + (r.balance ?? 0), 0),
      totalDepositedSum: (profData ?? []).reduce((s, r) => s + (r.total_deposit ?? 0), 0),
      totalWithdrawnSum: (profData ?? []).reduce((s, r) => s + (r.total_withdrawn ?? 0), 0),
    });
    setLoading(false);
  }, []);

  /* ── Load data when tab changes ── */
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "deposits")    loadDeposits();
    if (activeTab === "withdrawals") loadWithdrawals();
    if (activeTab === "users")       loadUsers();
    if (activeTab === "settings")    loadSettings();
    if (activeTab === "stats")       loadStats();
  }, [activeTab, isAdmin, loadDeposits, loadWithdrawals, loadUsers, loadSettings, loadStats]);

  useEffect(() => { if (isAdmin) refreshBadges(); }, [isAdmin, refreshBadges]);

  /* ─── Actions ─── */
  const setK = (k: string, v: boolean) => setBusy(p => ({ ...p, [k]: v }));

  async function approveDeposit(dep: DepositRow) {
    setK(dep.id, true);

    /* 1. Mark deposit approved */
    const { error } = await supabase.from("deposits").update({
      status: "approved", approved_at: new Date().toISOString(),
    }).eq("id", dep.id);
    if (error) { toast.error(error.message); setK(dep.id, false); return; }

    /* 2. Credit deposit amount */
    await supabase.rpc("increment_balance", { uid: dep.user_id, inc: dep.amount });

    /* 3. Fetch reward settings */
    const { data: settingsRows } = await supabase
      .from("admin_settings").select("key, value")
      .in("key", ["deposit_reward_percent", "referral_reward_percent"]);
    const sMap: Record<string, string> = {};
    (settingsRows ?? []).forEach((r: { key: string; value: string }) => { sMap[r.key] = r.value; });

    /* 4. Deposit bonus */
    const rewardPct = parseFloat(sMap.deposit_reward_percent ?? "0");
    if (rewardPct > 0) {
      const bonus = parseFloat(((dep.amount * rewardPct) / 100).toFixed(4));
      await supabase.rpc("increment_balance", { uid: dep.user_id, inc: bonus });
    }

    /* 5. Referral bonus to referrer */
    const refPct = parseFloat(sMap.referral_reward_percent ?? "0");
    if (refPct > 0) {
      const { data: prof } = await supabase
        .from("profiles").select("referred_by_code").eq("user_id", dep.user_id).single();
      if (prof?.referred_by_code) {
        const { data: referrer } = await supabase
          .from("profiles").select("user_id").eq("referral_code", prof.referred_by_code).single();
        if (referrer?.user_id) {
          const refBonus = parseFloat(((dep.amount * refPct) / 100).toFixed(4));
          await supabase.rpc("increment_balance", { uid: referrer.user_id, inc: refBonus });
        }
      }
    }

    setK(dep.id, false);
    toast.success(`Deposit approved ✓${rewardPct > 0 ? ` +${rewardPct}% bonus applied` : ""}`);
    loadDeposits(); loadStats();
  }

  async function rejectDeposit(id: string) {
    setK(id + "_r", true);
    const { error } = await supabase.from("deposits")
      .update({ status: "rejected", rejected_at: new Date().toISOString() }).eq("id", id);
    setK(id + "_r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit rejected");
    loadDeposits();
  }

  async function approveWithdrawal(w: WithdrawalRow) {
    const txHash = txInputs[w.id]?.trim();
    if (!txHash) { toast.error("Enter TX hash before approving"); return; }
    setK(w.id, true);
    const { error } = await supabase.from("withdrawals").update({
      status: "approved", tx_hash: txHash, approved_at: new Date().toISOString(),
    }).eq("id", w.id);
    if (error) { setK(w.id, false); toast.error(error.message); return; }
    await supabase.rpc("increment_balance", { uid: w.user_id, inc: -w.amount });
    setK(w.id, false);
    toast.success("Withdrawal approved ✓");
    loadWithdrawals();
  }

  async function rejectWithdrawal(w: WithdrawalRow) {
    setK(w.id + "_r", true);
    const { error } = await supabase.from("withdrawals").update({
      status: "rejected",
      reject_reason: rejectMsgs[w.id] ?? null,
      rejected_at: new Date().toISOString(),
    }).eq("id", w.id);
    if (!error) await supabase.rpc("increment_balance", { uid: w.user_id, inc: w.amount });
    setK(w.id + "_r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected + refunded ✓");
    loadWithdrawals();
  }

  async function updateBalance() {
    if (!balModal) return;
    const inc = parseFloat(balModal.amount);
    if (isNaN(inc)) { toast.error("Enter a valid number (e.g. 50 or -20)"); return; }
    setK("bal_" + balModal.user.id, true);
    const { error } = await supabase.rpc("increment_balance", { uid: balModal.user.user_id ?? balModal.user.id, inc });
    setK("bal_" + balModal.user.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Balance ${inc >= 0 ? "+" : ""}${inc} applied ✓`);
    setBalModal(null);
    loadUsers();
  }

  async function saveSettings() {
    setSavingSet(true);
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? "" }));
    const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
    setSavingSet(false);
    if (error) { toast.error("Save failed: " + error.message); return; }
    toast.success("Settings saved ✓");
  }

  async function postAnnouncement() {
    const msg = announce.trim();
    if (!msg) { toast.error("Write a message first"); return; }
    setPosting(true);
    const { error } = await supabase.from("announcements").insert({ message: msg, is_active: true });
    setPosting(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Announcement posted ✓");
    setAnnounce("");
  }

  function openScreenshot(dep: DepositRow) {
    const url = dep.screenshot_url || (dep.tx_hash?.startsWith("http") ? dep.tx_hash : null);
    if (url) { window.open(url, "_blank"); return; }
    if (dep.tx_hash && !dep.tx_hash.startsWith("http")) {
      const { data } = supabase.storage.from("deposits").getPublicUrl(dep.tx_hash);
      window.open(data.publicUrl, "_blank");
    }
  }

  /* ─── Render guards ─── */
  if (!authDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FA" }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!isAdmin) return null;

  const filteredUsers = users.filter(u =>
    !userSearch
      || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
      || (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS: { id: Tab; label: string; Icon: React.ElementType; badge?: number }[] = [
    { id: "deposits",    label: "Deposits",    Icon: DollarSign,      badge: pendingDepCount },
    { id: "withdrawals", label: "Withdrawals", Icon: ArrowDownToLine, badge: pendingWdCount },
    { id: "users",       label: "Users",       Icon: Users },
    { id: "settings",    label: "Settings",    Icon: Settings },
    { id: "announce",    label: "Announce",    Icon: Megaphone },
    { id: "stats",       label: "Stats",       Icon: BarChart3 },
  ];

  const SETTING_FIELDS: { key: keyof AdminSettings; label: string; placeholder: string }[] = [
    { key: "bep20_address",           label: "BEP20 Wallet Address",       placeholder: "0x..." },
    { key: "trc20_address",           label: "TRC20 Wallet Address",       placeholder: "T..." },
    { key: "deposit_reward_percent",  label: "Deposit Reward %",           placeholder: "0" },
    { key: "referral_reward_percent", label: "Referral Reward %",          placeholder: "10" },
    { key: "level_reward_percent",    label: "Level Reward %",             placeholder: "5" },
    { key: "airdrop_percent",         label: "Airdrop %",                  placeholder: "0" },
    { key: "withdrawal_min_hours",    label: "Min Withdrawal Hours",       placeholder: "24" },
    { key: "withdrawal_max_hours",    label: "Max Withdrawal Hours",       placeholder: "72" },
    { key: "min_withdraw",            label: "Min Withdraw Amount ($)",    placeholder: "10" },
    { key: "max_withdraw",            label: "Max Withdraw Amount ($)",    placeholder: "10000" },
    { key: "telegram_link",           label: "Telegram Group Link",        placeholder: "https://t.me/..." },
    { key: "customer_service_link",   label: "Customer Service Link",      placeholder: "https://t.me/..." },
  ];

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div className="min-h-screen pb-20" style={{ background: "#F8F9FA" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />

      {/* ── Balance Modal ── */}
      {balModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setBalModal(null); }}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl mx-4">
            <h3 className="text-sm font-bold mb-1" style={{ color: B }}>Edit Balance</h3>
            <p className="text-xs text-gray-400 mb-1">{balModal.user.email}</p>
            <p className="text-xs text-gray-500 mb-4">
              Current: <span className="font-bold" style={{ color: G }}>${(balModal.user.balance ?? 0).toFixed(2)}</span>
            </p>
            <input
              type="number"
              autoFocus
              placeholder="Amount (e.g. 50 or -20)"
              value={balModal.amount}
              onChange={e => setBalModal(m => m ? { ...m, amount: e.target.value } : null)}
              onKeyDown={e => { if (e.key === "Enter") updateBalance(); if (e.key === "Escape") setBalModal(null); }}
              className={inp + " mb-4"}
            />
            <div className="flex gap-2">
              <Btn color="blue" disabled={busy["bal_" + balModal.user.id]} onClick={updateBalance}>
                <Check size={13} /> Apply
              </Btn>
              <Btn color="gray" onClick={() => setBalModal(null)}>
                <X size={13} /> Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-8 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: B }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: B }}>Admin Dashboard</h1>
              <p className="text-[11px] text-gray-400">{adminEmail}</p>
            </div>
          </div>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border"
            style={{ color: "#6B7280", borderColor: "#E5E7EB", background: "white" }}>
            <ArrowLeft size={13} /> Back
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(({ id, label, Icon, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex-shrink-0"
              style={activeTab === id
                ? { background: B, color: "white" }
                : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }}>
              <Icon size={13} /> {label}
              {!!badge && badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: R }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Loading bar ── */}
        {loading && (
          <div className="flex justify-center mb-4">
            <RefreshCw size={16} className="animate-spin text-gray-400" />
          </div>
        )}

        {/* ══════════ TAB: DEPOSITS ══════════ */}
        {activeTab === "deposits" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>
                All Deposits <span className="text-gray-400 font-normal">({deposits.length})</span>
              </p>
              <button onClick={loadDeposits} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
            {deposits.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">No deposits yet</div>
            )}
            <div className="space-y-3">
              {deposits.map(dep => {
                const email = dep.profiles?.email ?? "—";
                const name  = dep.profiles?.name;
                const isPending = dep.status === "pending";
                const hasImg = !!(dep.screenshot_url || dep.tx_hash);
                return (
                  <div key={dep.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: B }}>{name ?? email}</p>
                          <StatusBadge status={dep.status} />
                        </div>
                        {name && <p className="text-xs text-gray-400">{email}</p>}
                        <p className="text-xl font-bold" style={{ color: G }}>${dep.amount.toFixed(2)}</p>
                        {dep.tx_hash && !dep.tx_hash.startsWith("http") && (
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-[220px]">TX: {dep.tx_hash}</p>
                        )}
                        <p className="text-[11px] text-gray-400">{new Date(dep.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        {hasImg && (
                          <Btn color="gray" size="sm" onClick={() => openScreenshot(dep)}>
                            <ExternalLink size={10} /> View
                          </Btn>
                        )}
                        {isPending && (
                          <div className="flex gap-1.5">
                            <Btn color="green" size="sm" disabled={busy[dep.id]} onClick={() => approveDeposit(dep)}>
                              <Check size={10} /> Approve
                            </Btn>
                            <Btn color="red" size="sm" disabled={busy[dep.id + "_r"]} onClick={() => rejectDeposit(dep.id)}>
                              <X size={10} /> Reject
                            </Btn>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ TAB: WITHDRAWALS ══════════ */}
        {activeTab === "withdrawals" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>
                All Withdrawals <span className="text-gray-400 font-normal">({withdrawals.length})</span>
              </p>
              <button onClick={loadWithdrawals} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
            {withdrawals.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">No withdrawals yet</div>
            )}
            <div className="space-y-3">
              {withdrawals.map(w => {
                const email = w.profiles?.email ?? "—";
                const name  = w.profiles?.name;
                const isPending = w.status === "pending";
                return (
                  <div key={w.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: B }}>{name ?? email}</p>
                          <StatusBadge status={w.status} />
                        </div>
                        {name && <p className="text-xs text-gray-400">{email}</p>}
                        <p className="text-xl font-bold" style={{ color: R }}>${w.amount.toFixed(2)}</p>
                        {w.network && <p className="text-xs text-gray-500">Network: <span className="font-semibold">{w.network}</span></p>}
                        {w.wallet_address && (
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px]">To: {w.wallet_address}</p>
                        )}
                        <p className="text-[11px] text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {isPending && (
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        {/* Approve row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter TX Hash to approve..."
                            value={txInputs[w.id] ?? ""}
                            onChange={e => setTxInputs(p => ({ ...p, [w.id]: e.target.value }))}
                            className={inp + " flex-1 py-2 text-xs"}
                          />
                          <Btn color="green" disabled={busy[w.id]} onClick={() => approveWithdrawal(w)}>
                            <Check size={11} /> Approve
                          </Btn>
                        </div>
                        {/* Reject row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Reject reason (optional)..."
                            value={rejectMsgs[w.id] ?? ""}
                            onChange={e => setRejectMsgs(p => ({ ...p, [w.id]: e.target.value }))}
                            className={inp + " flex-1 py-2 text-xs"}
                          />
                          <Btn color="red" disabled={busy[w.id + "_r"]} onClick={() => rejectWithdrawal(w)}>
                            <X size={11} /> Reject
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ TAB: USERS ══════════ */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>
                All Users <span className="text-gray-400 font-normal">({filteredUsers.length})</span>
              </p>
              <button onClick={loadUsers} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className={inp + " pl-9"}
              />
            </div>
            {filteredUsers.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">No users found</div>
            )}
            <div className="space-y-3">
              {filteredUsers.map(u => {
                const shortUid = (u.id ?? "").replace(/\D/g, "").slice(-6).padStart(6, "0");
                return (
                  <div key={u.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate" style={{ color: B }}>
                            {u.name ?? u.email ?? "—"}
                          </p>
                          {u.role === "admin" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF2F2", color: R }}>ADMIN</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{u.email ?? "—"}</p>
                        <p className="text-[10px] text-gray-300 font-mono">UID: {shortUid}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold" style={{ color: G }}>${(u.balance ?? 0).toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">balance</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Deposited",  value: `$${(u.total_deposit ?? 0).toFixed(2)}`,   color: B },
                        { label: "Withdrawn",  value: `$${(u.total_withdrawn ?? 0).toFixed(2)}`, color: R },
                        { label: "Ref. Code",  value: u.referral_code ?? "—",                    color: "#6B7280" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: "#F8F9FA" }}>
                          <p className="text-xs font-bold truncate" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </p>
                      <Btn color="blue" size="sm" onClick={() => setBalModal({ user: u, amount: "" })}>
                        <Edit2 size={10} /> Edit Balance
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ TAB: SETTINGS ══════════ */}
        {activeTab === "settings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: B }}>Platform Settings</p>
              <button onClick={loadSettings} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              {SETTING_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={settings[key]}
                    onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                    className={inp}
                  />
                </div>
              ))}
              <Btn color="blue" disabled={savingSet} onClick={saveSettings}>
                <Check size={13} /> {savingSet ? "Saving..." : "Save Settings"}
              </Btn>
            </div>
          </div>
        )}

        {/* ══════════ TAB: ANNOUNCE ══════════ */}
        {activeTab === "announce" && (
          <div>
            <p className="text-sm font-bold mb-4" style={{ color: B }}>Post Announcement</p>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message</label>
                <textarea
                  rows={5}
                  placeholder="Write your announcement here..."
                  value={announce}
                  onChange={e => setAnnounce(e.target.value)}
                  className={inp + " resize-none"}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">{announce.length} characters</p>
                <Btn color="blue" disabled={posting || !announce.trim()} onClick={postAnnouncement}>
                  <Megaphone size={13} /> {posting ? "Posting..." : "Post Announcement"}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB: STATS ══════════ */}
        {activeTab === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: B }}>Platform Statistics</p>
              <button onClick={loadStats} className="p-1.5 rounded-lg hover:bg-white text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users",          value: stats.totalUsers.toString(),               icon: <Users size={20} />,          color: B,        bg: "#EFF6FF", sub: "registered" },
                { label: "Total Deposits",        value: `$${stats.totalDeposits.toFixed(2)}`,     icon: <DollarSign size={20} />,     color: G,        bg: "#F0FDF4", sub: "approved only" },
                { label: "Pending Deposits",      value: stats.pendingDeposits.toString(),          icon: <DollarSign size={20} />,     color: Y,        bg: "#FFFBEB", sub: "awaiting review" },
                { label: "Pending Withdrawals",   value: stats.pendingWithdrawals.toString(),       icon: <ArrowDownToLine size={20} />, color: R,       bg: "#FEF2F2", sub: "awaiting payout" },
                { label: "Total Withdrawn",       value: `$${stats.totalWithdrawn.toFixed(2)}`,    icon: <BarChart3 size={20} />,      color: "#7C3AED", bg: "#F5F3FF", sub: "paid out" },
                { label: "Total Users Fund",      value: `$${stats.usersBalance.toFixed(2)}`,      icon: <DollarSign size={20} />,     color: "#0891B2", bg: "#ECFEFF", sub: "current balances" },
                { label: "Total Deposited",       value: `$${stats.totalDepositedSum.toFixed(2)}`, icon: <BarChart3 size={20} />,      color: G,        bg: "#F0FDF4", sub: "all-time sum" },
                { label: "Total Withdrawn Sum",   value: `$${stats.totalWithdrawnSum.toFixed(2)}`, icon: <ArrowDownToLine size={20} />, color: R,       bg: "#FEF2F2", sub: "all-time sum" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <p className="text-2xl font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
