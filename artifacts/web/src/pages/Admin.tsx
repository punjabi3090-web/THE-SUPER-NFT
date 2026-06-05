import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, DollarSign, Clock, ShoppingBag, Shield, Search,
  Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp,
  Settings, Send, Headphones, Link, AlertCircle, RefreshCw,
} from "lucide-react";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

type Tab = "deposits" | "withdrawals" | "users" | "nfts" | "settings";

type DepositRow = {
  id: string; amount: number; tx_hash: string | null; screenshot_url?: string | null;
  status: string; created_at: string; user_id: string;
  profiles: { email: string | null } | null;
};
type WithdrawalRow = {
  id: string; amount: number; wallet_address: string | null;
  status: string; created_at: string; user_id: string;
  profiles: { email: string | null } | null;
};
type UserRow = {
  id: string; user_id: string | null; email: string | null; balance: number | null;
  referral_code: string | null; role: string | null; full_name: string | null; is_blocked?: boolean;
};
type NftPackage = {
  id: string; name: string; price: number;
  daily_profit_percent: number; duration_days: number; image_url: string | null;
};
type Stats = {
  totalUsers: number; totalDeposits: number;
  pendingWithdrawals: number; totalNftsSold: number;
};
type AdminSettings = {
  telegram_link: string;
  customer_service_link: string;
  usdt_bep20_address: string;
  usdt_trc20_address: string;
  bep20_qr_url: string;
  trc20_qr_url: string;
  min_withdraw: string;
  max_withdraw: string;
};

const DEFAULT_SETTINGS: AdminSettings = {
  telegram_link:          "https://t.me/+uE-PlUgGg-wzOWRk",
  customer_service_link:  "https://t.me/TigerProtocolGlobal",
  usdt_bep20_address:     "",
  usdt_trc20_address:     "",
  bep20_qr_url:           "",
  trc20_qr_url:           "",
  min_withdraw:           "10",
  max_withdraw:           "10000",
};

const inp = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1E3A8A] text-gray-800 placeholder-gray-300`;

function ActionBtn({ color, disabled, onClick, children }: {
  color: "red" | "blue" | "green" | "gray";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const bg = { red: BRAND.red, blue: BRAND.blue, green: "#16a34a", gray: "#6B7280" }[color];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-colors"
      style={{ background: bg }}
    >
      {children}
    </button>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole]             = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [tab, setTab]               = useState<Tab>("deposits");

  const [deposits, setDeposits]       = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [users, setUsers]             = useState<UserRow[]>([]);
  const [nfts, setNfts]               = useState<NftPackage[]>([]);
  const [stats, setStats]             = useState<Stats>({ totalUsers: 0, totalDeposits: 0, pendingWithdrawals: 0, totalNftsSold: 0 });
  const [settings, setSettings]       = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings]   = useState(false);

  const [busy, setBusy]             = useState<Record<string, boolean>>({});
  const [userSearch, setUserSearch] = useState("");
  const [balEdit, setBalEdit]       = useState<Record<string, string>>({});
  const [editNft, setEditNft]       = useState<NftPackage | null>(null);
  const [nftForm, setNftForm]       = useState({ name: "", price: "", daily_profit_percent: "", duration_days: "", image_url: "" });
  const [showAddNft, setShowAddNft] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("user_id", user.id).single()
      .then(({ data }) => {
        setRole(data?.role ?? null);
        setRoleLoading(false);
        if (data?.role !== "admin") navigate("/", { replace: true });
      });
  }, [user, navigate]);

  const loadStats = useCallback(async () => {
    const [
      { count: totalUsers },
      { data: depData },
      { count: pendingWithdrawals },
      { count: totalNftsSold },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("deposits").select("amount").eq("status", "approved"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("user_nfts").select("*", { count: "exact", head: true }),
    ]);
    const totalDeposits = (depData ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
    setStats({ totalUsers: totalUsers ?? 0, totalDeposits, pendingWithdrawals: pendingWithdrawals ?? 0, totalNftsSold: totalNftsSold ?? 0 });
  }, []);

  const loadDeposits = useCallback(async () => {
    const { data } = await supabase
      .from("deposits").select("id, amount, tx_hash, screenshot_url, status, created_at, user_id, profiles(email)")
      .eq("status", "pending").order("created_at", { ascending: false });
    setDeposits((data ?? []) as unknown as DepositRow[]);
  }, []);

  const loadWithdrawals = useCallback(async () => {
    const { data } = await supabase
      .from("withdrawals").select("*, profiles(email)")
      .eq("status", "pending").order("created_at", { ascending: false });
    setWithdrawals((data ?? []) as WithdrawalRow[]);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles").select("id, user_id, email, balance, referral_code, role, full_name")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as UserRow[]);
  }, []);

  const loadNfts = useCallback(async () => {
    const { data } = await supabase.from("nft_packages").select("*").order("price");
    setNfts((data ?? []) as NftPackage[]);
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    const { data } = await supabase.from("admin_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value ?? ""; });
      setSettings({ ...DEFAULT_SETTINGS, ...map });
    }
    setSettingsLoading(false);
  }, []);

  useEffect(() => {
    if (role !== "admin") return;
    loadStats();
    loadDeposits();
    loadWithdrawals();
    loadUsers();
    loadNfts();
    loadSettings();
  }, [role, loadStats, loadDeposits, loadWithdrawals, loadUsers, loadNfts, loadSettings]);

  const setBusyKey = (k: string, v: boolean) => setBusy(p => ({ ...p, [k]: v }));

  async function approveDeposit(dep: DepositRow) {
    setBusyKey(dep.id, true);
    const { error } = await supabase.from("deposits").update({
      status: "approved", approved_by: user!.id, approved_at: new Date().toISOString(),
    }).eq("id", dep.id);
    if (!error) await supabase.rpc("increment_balance", { uid: dep.user_id, inc: dep.amount });
    setBusyKey(dep.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit Approved ✓ Balance Added");
    loadDeposits(); loadStats();
  }

  async function rejectDeposit(id: string) {
    setBusyKey(id + "r", true);
    const { error } = await supabase.from("deposits").update({ status: "rejected" }).eq("id", id);
    setBusyKey(id + "r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit Rejected");
    loadDeposits();
  }

  async function approveWithdrawal(id: string) {
    setBusyKey(id, true);
    const { error } = await supabase.from("withdrawals").update({ status: "approved" }).eq("id", id);
    setBusyKey(id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal Approved ✓");
    loadWithdrawals(); loadStats();
  }

  async function rejectWithdrawal(w: WithdrawalRow) {
    setBusyKey(w.id + "r", true);
    const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", w.id);
    if (!error) await supabase.rpc("increment_balance", { uid: w.user_id, inc: w.amount });
    setBusyKey(w.id + "r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected + Refunded ✓");
    loadWithdrawals(); loadStats();
  }

  async function updateBalance(u: UserRow) {
    const inc = parseFloat(balEdit[u.id] ?? "");
    if (isNaN(inc)) { toast.error("Enter a valid amount"); return; }
    setBusyKey("bal_" + u.id, true);
    const { error } = await supabase.rpc("increment_balance", { uid: u.user_id ?? u.id, inc });
    setBusyKey("bal_" + u.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Balance updated by $${inc}`);
    setBalEdit(p => ({ ...p, [u.id]: "" }));
    loadUsers(); loadStats();
  }

  async function makeAdmin(id: string) {
    setBusyKey("adm_" + id, true);
    const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", id);
    setBusyKey("adm_" + id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("User promoted to Admin ✓");
    loadUsers();
  }

  async function addNft() {
    const { name, price, daily_profit_percent, duration_days, image_url } = nftForm;
    if (!name || !price || !daily_profit_percent || !duration_days) { toast.error("Fill all required fields"); return; }
    const { error } = await supabase.from("nft_packages").insert({
      name, price: parseFloat(price),
      daily_profit_percent: parseFloat(daily_profit_percent),
      duration_days: parseInt(duration_days),
      image_url: image_url || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("NFT Package Added ✓");
    setNftForm({ name: "", price: "", daily_profit_percent: "", duration_days: "", image_url: "" });
    setShowAddNft(false);
    loadNfts();
  }

  async function saveEditNft() {
    if (!editNft) return;
    setBusyKey("nft_" + editNft.id, true);
    const { error } = await supabase.from("nft_packages").update({
      name: editNft.name, price: editNft.price,
      daily_profit_percent: editNft.daily_profit_percent,
      duration_days: editNft.duration_days,
      image_url: editNft.image_url,
    }).eq("id", editNft.id);
    setBusyKey("nft_" + editNft.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("NFT Package Updated ✓");
    setEditNft(null);
    loadNfts();
  }

  async function deleteNft(id: string) {
    if (!confirm("Delete this NFT package?")) return;
    setBusyKey("del_" + id, true);
    const { error } = await supabase.from("nft_packages").delete().eq("id", id);
    setBusyKey("del_" + id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("NFT Package Deleted");
    loadNfts();
  }

  async function saveSettings() {
    setSavingSettings(true);
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? "" }));
    const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
    setSavingSettings(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Settings Saved ✓");
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${BRAND.red} transparent transparent transparent` }} />
      </div>
    );
  }

  if (role !== "admin") return null;

  const filteredUsers = users.filter(u =>
    !userSearch || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
      || (u.full_name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "deposits",    label: "Deposits",    Icon: DollarSign },
    { id: "withdrawals", label: "Withdrawals", Icon: Clock },
    { id: "users",       label: "Users",       Icon: Users },
    { id: "nfts",        label: "NFTs",        Icon: ShoppingBag },
    { id: "settings",    label: "Settings",    Icon: Settings },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: BRAND.bg }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: BRAND.blue, border: "1px solid #e5e7eb" } }} />

      <div className="max-w-3xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: BRAND.blue }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: BRAND.blue }}>Admin Panel</h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/cron-test")}
              className="text-xs font-semibold px-3 py-2 rounded-xl border transition-colors"
              style={{ color: BRAND.blue, borderColor: "#BFDBFE", background: "#EFF6FF" }}
            >
              ⏱ Cron
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold px-3 py-2 rounded-xl border transition-colors"
              style={{ color: "#6B7280", borderColor: "#E5E7EB", background: "#F9FAFB" }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Users size={15} />,      label: "Total Users",        value: stats.totalUsers,                    color: BRAND.blue },
            { icon: <DollarSign size={15} />, label: "Approved Deposits",  value: `$${stats.totalDeposits.toFixed(0)}`, color: "#16a34a" },
            { icon: <Clock size={15} />,      label: "Pending Withdrawals", value: stats.pendingWithdrawals,            color: BRAND.red },
            { icon: <ShoppingBag size={15} />,label: "NFTs Sold",          value: stats.totalNftsSold,                 color: "#D97706" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2" style={{ color: s.color }}>
                {s.icon}
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
              style={tab === id
                ? { background: BRAND.blue, color: "white" }
                : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }
              }
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ─────────── DEPOSITS TAB ─────────── */}
        {tab === "deposits" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Pending Deposits ({deposits.length})</p>
              <button onClick={loadDeposits} className="p-1.5 rounded-lg hover:bg-white transition-colors text-gray-400"><RefreshCw size={14} /></button>
            </div>
            {deposits.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">No pending deposits 🎉</div>
            )}
            {deposits.map(dep => (
              <div key={dep.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: BRAND.blue }}>{dep.profiles?.email ?? "—"}</p>
                    <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>${dep.amount.toFixed(2)}</p>
                    {dep.tx_hash && !dep.tx_hash.startsWith("SCREENSHOT") && (
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">Tx: {dep.tx_hash}</p>
                    )}
                    {(dep.screenshot_url || dep.tx_hash?.startsWith("http")) && (
                      <a
                        href={dep.screenshot_url ?? dep.tx_hash ?? ""}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold underline"
                        style={{ color: BRAND.blue }}
                      >
                        📷 View Screenshot
                      </a>
                    )}
                    <p className="text-xs text-gray-400">{new Date(dep.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <ActionBtn color="green" disabled={busy[dep.id]} onClick={() => approveDeposit(dep)}>
                      <Check size={11} /> Approve
                    </ActionBtn>
                    <ActionBtn color="red" disabled={busy[dep.id + "r"]} onClick={() => rejectDeposit(dep.id)}>
                      <X size={11} /> Reject
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────────── WITHDRAWALS TAB ─────────── */}
        {tab === "withdrawals" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Pending Withdrawals ({withdrawals.length})</p>
              <button onClick={loadWithdrawals} className="p-1.5 rounded-lg hover:bg-white transition-colors text-gray-400"><RefreshCw size={14} /></button>
            </div>
            {withdrawals.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">No pending withdrawals 🎉</div>
            )}
            {withdrawals.map(w => (
              <div key={w.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: BRAND.blue }}>{w.profiles?.email ?? "—"}</p>
                    <p className="text-2xl font-bold" style={{ color: BRAND.red }}>${w.amount.toFixed(2)}</p>
                    {w.wallet_address && (
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">To: {w.wallet_address}</p>
                    )}
                    <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <ActionBtn color="green" disabled={busy[w.id]} onClick={() => approveWithdrawal(w.id)}>
                      <Check size={11} /> Approve
                    </ActionBtn>
                    <ActionBtn color="red" disabled={busy[w.id + "r"]} onClick={() => rejectWithdrawal(w)}>
                      <X size={11} /> Reject + Refund
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────────── USERS TAB ─────────── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3 text-gray-300" />
              <input
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className={inp + " pl-9"}
              />
            </div>
            <p className="text-xs text-gray-400">{filteredUsers.length} users</p>
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-bold" style={{ color: BRAND.blue }}>{u.full_name ?? u.email ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{u.email ?? "—"}</p>
                        {u.role === "admin" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF2F2", color: BRAND.red }}>ADMIN</span>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold" style={{ color: "#16a34a" }}>${(u.balance ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="±Amount (e.g. 50 or -20)"
                      value={balEdit[u.id] ?? ""}
                      onChange={e => setBalEdit(p => ({ ...p, [u.id]: e.target.value }))}
                      className={inp + " flex-1 py-2 text-xs"}
                    />
                    <ActionBtn color="blue" disabled={busy["bal_" + u.id]} onClick={() => updateBalance(u)}>
                      Update
                    </ActionBtn>
                    {u.role !== "admin" && (
                      <ActionBtn color="gray" disabled={busy["adm_" + u.id]} onClick={() => makeAdmin(u.id)}>
                        <Shield size={10} /> Admin
                      </ActionBtn>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ─────────── NFTs TAB ─────────── */}
        {tab === "nfts" && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAddNft(v => !v)}
              className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              style={{ background: BRAND.blue }}
            >
              <Plus size={14} />
              {showAddNft ? "Cancel" : "Add NFT Package"}
              {showAddNft ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAddNft && (
              <div className="bg-white rounded-2xl p-5 space-y-3 border border-gray-100 shadow-sm">
                <p className="text-sm font-bold mb-1" style={{ color: BRAND.blue }}>New NFT Package</p>
                {[
                  { key: "name",                 placeholder: "Package Name *",       type: "text" },
                  { key: "price",                placeholder: "Price (USDT) *",       type: "number" },
                  { key: "daily_profit_percent", placeholder: "Daily Profit % *",     type: "number" },
                  { key: "duration_days",        placeholder: "Duration (days) *",    type: "number" },
                  { key: "image_url",            placeholder: "Image URL (optional)", type: "text" },
                ].map(f => (
                  <input
                    key={f.key}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(nftForm as Record<string, string>)[f.key]}
                    onChange={e => setNftForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={inp}
                  />
                ))}
                <ActionBtn color="green" onClick={addNft}>
                  <Plus size={12} /> Add Package
                </ActionBtn>
              </div>
            )}

            <div className="space-y-3">
              {nfts.map(nft => (
                <div key={nft.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  {editNft?.id === nft.id ? (
                    <div className="space-y-2">
                      {[
                        { key: "name",                 label: "Name",    type: "text" },
                        { key: "price",                label: "Price",   type: "number" },
                        { key: "daily_profit_percent", label: "Daily %", type: "number" },
                        { key: "duration_days",        label: "Days",    type: "number" },
                        { key: "image_url",            label: "Image URL", type: "text" },
                      ].map(f => (
                        <input
                          key={f.key}
                          type={f.type}
                          placeholder={f.label}
                          value={String((editNft as Record<string, unknown>)[f.key] ?? "")}
                          onChange={e => setEditNft(p => p ? ({
                            ...p,
                            [f.key]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                          }) : p)}
                          className={inp + " py-2 text-xs"}
                        />
                      ))}
                      <div className="flex gap-2 pt-1">
                        <ActionBtn color="green" disabled={busy["nft_" + nft.id]} onClick={saveEditNft}>
                          <Check size={11} /> Save
                        </ActionBtn>
                        <ActionBtn color="red" onClick={() => setEditNft(null)}>
                          <X size={11} /> Cancel
                        </ActionBtn>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {nft.image_url && (
                        <img src={nft.image_url} alt={nft.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: BRAND.blue }}>{nft.name}</p>
                        <p className="text-xs text-gray-400">
                          ${nft.price} · {nft.daily_profit_percent}%/day · {nft.duration_days}d
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setEditNft(nft)}
                          className="p-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-gray-50"
                          style={{ color: BRAND.blue, borderColor: "#BFDBFE" }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          disabled={busy["del_" + nft.id]}
                          onClick={() => deleteNft(nft.id)}
                          className="p-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-red-50"
                          style={{ color: BRAND.red, borderColor: "#FECACA" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {nfts.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">No NFT packages yet</div>
              )}
            </div>
          </div>
        )}

        {/* ─────────── SETTINGS TAB ─────────── */}
        {tab === "settings" && (
          <div className="space-y-5">
            {settingsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${BRAND.red} transparent transparent transparent` }} />
              </div>
            ) : (
              <>
                {/* Section A — Social Links */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF" }}>
                      <Link size={14} style={{ color: BRAND.blue }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Section A — Social Links</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
                        <Send size={12} style={{ color: BRAND.red }} /> Telegram Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://t.me/..."
                        value={settings.telegram_link}
                        onChange={e => setSettings(p => ({ ...p, telegram_link: e.target.value }))}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
                        <Headphones size={12} style={{ color: BRAND.red }} /> Customer Service Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://t.me/..."
                        value={settings.customer_service_link}
                        onChange={e => setSettings(p => ({ ...p, customer_service_link: e.target.value }))}
                        className={inp}
                      />
                    </div>
                  </div>
                </div>

                {/* Section B — Deposit Addresses */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                      <DollarSign size={14} style={{ color: BRAND.red }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Section B — Deposit Addresses</p>
                  </div>
                  <div className="flex items-start gap-1.5 mb-4 rounded-xl p-3" style={{ background: "#FFF7ED" }}>
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-orange-400" />
                    <p className="text-xs text-orange-600">These addresses will be shown to users on the Deposit page</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">USDT BEP20 (BSC)</p>
                      <input
                        type="text"
                        placeholder="Enter BEP20 address 0x..."
                        value={settings.usdt_bep20_address}
                        onChange={e => setSettings(p => ({ ...p, usdt_bep20_address: e.target.value }))}
                        className={inp + " font-mono text-xs"}
                      />
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">QR Code URL (optional)</p>
                        <input
                          type="url"
                          placeholder="https://... (paste image URL)"
                          value={settings.bep20_qr_url}
                          onChange={e => setSettings(p => ({ ...p, bep20_qr_url: e.target.value }))}
                          className={inp}
                        />
                        {settings.bep20_qr_url && (
                          <img src={settings.bep20_qr_url} alt="BEP20 QR" className="mt-2 w-28 h-28 rounded-xl object-contain border border-gray-200" />
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">USDT TRC20 (TRON)</p>
                      <input
                        type="text"
                        placeholder="Enter TRC20 address T..."
                        value={settings.usdt_trc20_address}
                        onChange={e => setSettings(p => ({ ...p, usdt_trc20_address: e.target.value }))}
                        className={inp + " font-mono text-xs"}
                      />
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">QR Code URL (optional)</p>
                        <input
                          type="url"
                          placeholder="https://... (paste image URL)"
                          value={settings.trc20_qr_url}
                          onChange={e => setSettings(p => ({ ...p, trc20_qr_url: e.target.value }))}
                          className={inp}
                        />
                        {settings.trc20_qr_url && (
                          <img src={settings.trc20_qr_url} alt="TRC20 QR" className="mt-2 w-28 h-28 rounded-xl object-contain border border-gray-200" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C — Limits */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F0FDF4" }}>
                      <AlertCircle size={14} className="text-green-600" />
                    </div>
                    <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Section C — Withdraw Limits</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Min Withdraw (USDT)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={settings.min_withdraw}
                        onChange={e => setSettings(p => ({ ...p, min_withdraw: e.target.value }))}
                        className={inp}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Max Withdraw (USDT)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={settings.max_withdraw}
                        onChange={e => setSettings(p => ({ ...p, max_withdraw: e.target.value }))}
                        className={inp}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: BRAND.red }}
                >
                  {savingSettings
                    ? <><RefreshCw size={16} className="animate-spin" /> Saving...</>
                    : <><Check size={16} /> Save All Settings</>
                  }
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
