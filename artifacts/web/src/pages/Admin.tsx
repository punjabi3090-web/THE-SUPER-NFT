import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, DollarSign, Clock, ShoppingBag,
  ChevronDown, ChevronUp, Search, Plus, Trash2, Edit2, Check, X, Shield
} from "lucide-react";

type Tab = "deposits" | "withdrawals" | "users" | "nfts";

type DepositRow = {
  id: string; amount: number; transaction_hash: string | null;
  status: string; created_at: string; user_id: string;
  profiles: { email: string | null } | null;
};
type WithdrawalRow = {
  id: string; amount: number; wallet_address: string | null;
  status: string; created_at: string; user_id: string;
  profiles: { email: string | null } | null;
};
type UserRow = {
  id: string; email: string | null; balance: number | null;
  referral_code: string | null; role: string | null; full_name: string | null;
};
type NftPackage = {
  id: string; name: string; price: number;
  daily_profit_percent: number; duration_days: number; image_url: string | null;
};
type Stats = {
  totalUsers: number; totalDeposits: number;
  pendingWithdrawals: number; totalNftsSold: number;
};

const tabCls = (active: boolean) =>
  `px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
    active ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
  }`;

const btn = (color: "green" | "red" | "blue" | "purple") => {
  const map = {
    green: "bg-emerald-600 hover:bg-emerald-500",
    red:   "bg-red-600 hover:bg-red-500",
    blue:  "bg-blue-600 hover:bg-blue-500",
    purple:"bg-purple-600 hover:bg-purple-500",
  };
  return `${map[color]} text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50`;
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole]       = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("deposits");

  const [deposits, setDeposits]       = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [users, setUsers]             = useState<UserRow[]>([]);
  const [nfts, setNfts]               = useState<NftPackage[]>([]);
  const [stats, setStats]             = useState<Stats>({ totalUsers: 0, totalDeposits: 0, pendingWithdrawals: 0, totalNftsSold: 0 });

  const [busy, setBusy]         = useState<Record<string, boolean>>({});
  const [userSearch, setUserSearch] = useState("");
  const [balEdit, setBalEdit]   = useState<Record<string, string>>({});
  const [editNft, setEditNft]   = useState<NftPackage | null>(null);
  const [nftForm, setNftForm]   = useState({ name: "", price: "", daily_profit_percent: "", duration_days: "", image_url: "" });
  const [showAddNft, setShowAddNft] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("id", user.id).single()
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
    setStats({
      totalUsers: totalUsers ?? 0,
      totalDeposits,
      pendingWithdrawals: pendingWithdrawals ?? 0,
      totalNftsSold: totalNftsSold ?? 0,
    });
  }, []);

  const loadDeposits = useCallback(async () => {
    const { data } = await supabase
      .from("deposits").select("*, profiles(email)")
      .eq("status", "pending").order("created_at", { ascending: false });
    setDeposits((data ?? []) as DepositRow[]);
  }, []);

  const loadWithdrawals = useCallback(async () => {
    const { data } = await supabase
      .from("withdrawals").select("*, profiles(email)")
      .eq("status", "pending").order("created_at", { ascending: false });
    setWithdrawals((data ?? []) as WithdrawalRow[]);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles").select("id, email, balance, referral_code, role, full_name")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as UserRow[]);
  }, []);

  const loadNfts = useCallback(async () => {
    const { data } = await supabase.from("nft_packages").select("*").order("price");
    setNfts((data ?? []) as NftPackage[]);
  }, []);

  useEffect(() => {
    if (role !== "admin") return;
    loadStats();
    loadDeposits();
    loadWithdrawals();
    loadUsers();
    loadNfts();
  }, [role, loadStats, loadDeposits, loadWithdrawals, loadUsers, loadNfts]);

  const setBusyKey = (k: string, v: boolean) => setBusy(p => ({ ...p, [k]: v }));

  async function approveDeposit(dep: DepositRow) {
    setBusyKey(dep.id, true);
    const { error } = await supabase.from("deposits").update({
      status: "approved", approved_by: user!.id, approved_at: new Date().toISOString(),
    }).eq("id", dep.id);
    if (!error) await supabase.rpc("increment_balance", { uid: dep.user_id, inc: dep.amount });
    setBusyKey(dep.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit Approved + Balance Added ✓");
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
    const { error } = await supabase.rpc("increment_balance", { uid: u.id, inc });
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

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (role !== "admin") return null;

  const inp = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500";
  const filteredUsers = users.filter(u =>
    !userSearch || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-16">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#fff", border: "1px solid #334155" } }} />

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Admin Panel</h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/cron-test")}
              className="text-sm text-purple-300 hover:text-white bg-purple-900/50 hover:bg-purple-800 px-3 py-2 rounded-xl transition-colors"
            >
              ⏱ Cron
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Users size={16} />, label: "Total Users",         value: stats.totalUsers,                    color: "text-purple-400" },
            { icon: <DollarSign size={16} />, label: "Approved Deposits", value: `$${stats.totalDeposits.toFixed(2)}`, color: "text-emerald-400" },
            { icon: <Clock size={16} />, label: "Pending Withdrawals",  value: stats.pendingWithdrawals,            color: "text-yellow-400" },
            { icon: <ShoppingBag size={16} />, label: "NFTs Sold",      value: stats.totalNftsSold,                 color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-2xl p-4">
              <div className={`flex items-center gap-1.5 mb-2 ${s.color}`}>{s.icon}<p className="text-xs text-slate-400">{s.label}</p></div>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(["deposits", "withdrawals", "users", "nfts"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={tabCls(tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ─────────── DEPOSITS TAB ─────────── */}
        {tab === "deposits" && (
          <div className="space-y-3">
            {deposits.length === 0 && (
              <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">No pending deposits</div>
            )}
            {deposits.map(dep => (
              <div key={dep.id} className="bg-slate-800 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{dep.profiles?.email ?? "—"}</p>
                    <p className="text-xl font-extrabold text-emerald-400">${dep.amount.toFixed(2)}</p>
                    {dep.transaction_hash && (
                      <p className="text-xs text-slate-400 font-mono truncate max-w-[220px]">Tx: {dep.transaction_hash}</p>
                    )}
                    <p className="text-xs text-slate-500">{new Date(dep.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button disabled={busy[dep.id]} onClick={() => approveDeposit(dep)} className={btn("green")}>
                      <Check size={12} className="inline mr-1" />Approve
                    </button>
                    <button disabled={busy[dep.id + "r"]} onClick={() => rejectDeposit(dep.id)} className={btn("red")}>
                      <X size={12} className="inline mr-1" />Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────────── WITHDRAWALS TAB ─────────── */}
        {tab === "withdrawals" && (
          <div className="space-y-3">
            {withdrawals.length === 0 && (
              <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">No pending withdrawals</div>
            )}
            {withdrawals.map(w => (
              <div key={w.id} className="bg-slate-800 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{w.profiles?.email ?? "—"}</p>
                    <p className="text-xl font-extrabold text-blue-400">${w.amount.toFixed(2)}</p>
                    {w.wallet_address && (
                      <p className="text-xs text-slate-400 font-mono truncate max-w-[220px]">Wallet: {w.wallet_address}</p>
                    )}
                    <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button disabled={busy[w.id]} onClick={() => approveWithdrawal(w.id)} className={btn("green")}>
                      <Check size={12} className="inline mr-1" />Approve
                    </button>
                    <button disabled={busy[w.id + "r"]} onClick={() => rejectWithdrawal(w)} className={btn("red")}>
                      <X size={12} className="inline mr-1" />Reject + Refund
                    </button>
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
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                placeholder="Search by email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className={inp + " pl-8"}
              />
            </div>
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-slate-800 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{u.email ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Code: {u.referral_code ?? "—"}</span>
                        {u.role === "admin" && (
                          <span className="text-xs bg-purple-700 text-purple-200 px-1.5 py-0.5 rounded font-semibold">ADMIN</span>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-emerald-400">${(u.balance ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="±Amount (e.g. 50 or -20)"
                      value={balEdit[u.id] ?? ""}
                      onChange={e => setBalEdit(p => ({ ...p, [u.id]: e.target.value }))}
                      className={inp + " flex-1 text-xs py-1.5"}
                    />
                    <button
                      disabled={busy["bal_" + u.id]}
                      onClick={() => updateBalance(u)}
                      className={btn("blue")}
                    >
                      Update
                    </button>
                    {u.role !== "admin" && (
                      <button
                        disabled={busy["adm_" + u.id]}
                        onClick={() => makeAdmin(u.id)}
                        className={btn("purple")}
                      >
                        <Shield size={11} className="inline mr-1" />Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ─────────── NFTs TAB ─────────── */}
        {tab === "nfts" && (
          <div className="space-y-4">
            {/* Add NFT Form Toggle */}
            <button
              onClick={() => setShowAddNft(v => !v)}
              className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={14} />
              {showAddNft ? "Cancel" : "Add NFT Package"}
              {showAddNft ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAddNft && (
              <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-white mb-1">New NFT Package</p>
                {[
                  { key: "name",                  placeholder: "Package Name *",         type: "text" },
                  { key: "price",                 placeholder: "Price (USDT) *",         type: "number" },
                  { key: "daily_profit_percent",  placeholder: "Daily Profit % *",       type: "number" },
                  { key: "duration_days",         placeholder: "Duration (days) *",      type: "number" },
                  { key: "image_url",             placeholder: "Image URL (optional)",   type: "text" },
                ].map(f => (
                  <input
                    key={f.key}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(nftForm as any)[f.key]}
                    onChange={e => setNftForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={inp}
                  />
                ))}
                <button onClick={addNft} className={btn("green") + " w-full py-2.5"}>
                  <Plus size={13} className="inline mr-1" />Add Package
                </button>
              </div>
            )}

            {/* NFT List */}
            <div className="space-y-3">
              {nfts.map(nft => (
                <div key={nft.id} className="bg-slate-800 rounded-2xl p-4">
                  {editNft?.id === nft.id ? (
                    <div className="space-y-2">
                      {[
                        { key: "name",                 label: "Name",          type: "text" },
                        { key: "price",                label: "Price",         type: "number" },
                        { key: "daily_profit_percent", label: "Daily %",       type: "number" },
                        { key: "duration_days",        label: "Duration days", type: "number" },
                        { key: "image_url",            label: "Image URL",     type: "text" },
                      ].map(f => (
                        <input
                          key={f.key}
                          type={f.type}
                          placeholder={f.label}
                          value={String((editNft as any)[f.key] ?? "")}
                          onChange={e => setEditNft(p => p ? ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }) : p)}
                          className={inp + " text-xs py-1.5"}
                        />
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button disabled={busy["nft_" + nft.id]} onClick={saveEditNft} className={btn("green")}>
                          <Check size={12} className="inline mr-1" />Save
                        </button>
                        <button onClick={() => setEditNft(null)} className={btn("red")}>
                          <X size={12} className="inline mr-1" />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {nft.image_url && (
                        <img src={nft.image_url} alt={nft.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{nft.name}</p>
                        <p className="text-xs text-slate-400">
                          ${nft.price} · {nft.daily_profit_percent}%/day · {nft.duration_days}d
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditNft(nft)} className={btn("blue")}>
                          <Edit2 size={11} className="inline mr-1" />Edit
                        </button>
                        <button disabled={busy["del_" + nft.id]} onClick={() => deleteNft(nft.id)} className={btn("red")}>
                          <Trash2 size={11} className="inline mr-1" />Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {nfts.length === 0 && (
                <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">No NFT packages yet</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
