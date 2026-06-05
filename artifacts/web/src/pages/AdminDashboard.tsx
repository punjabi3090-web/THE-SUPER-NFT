import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield, RefreshCw, Search, DollarSign, Users,
  BarChart3, Check, X, ExternalLink, Edit2, ArrowLeft,
} from "lucide-react";

const R = "#DC2626";
const B = "#1E3A8A";
const G = "#16a34a";

type Tab = "deposits" | "users" | "stats";

type DepositRow = {
  id: string; amount: number; tx_hash: string | null;
  screenshot_url: string | null; status: string;
  created_at: string; user_id: string;
  profiles: { email: string | null; full_name: string | null } | null;
};

type UserRow = {
  id: string; email: string | null; full_name: string | null;
  balance: number | null; total_deposit: number | null;
  total_withdrawn: number | null; referral_code: string | null;
  created_at: string | null; role: string | null;
};

type Stats = {
  totalUsers: number; totalDeposits: number;
  pendingDeposits: number; totalWithdrawn: number;
};

const ZERO_STATS: Stats = { totalUsers: 0, totalDeposits: 0, pendingDeposits: 0, totalWithdrawn: 0 };

function Badge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#FEF9C3", color: "#854D0E" },
    approved: { bg: "#DCFCE7", color: "#166534" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = cfg[status] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

function Btn({
  color = "blue", disabled, onClick, children, small,
}: {
  color?: "blue" | "green" | "red" | "gray";
  disabled?: boolean; onClick: () => void;
  children: React.ReactNode; small?: boolean;
}) {
  const bg = { blue: B, green: G, red: R, gray: "#6B7280" }[color];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1 font-bold rounded-lg text-white disabled:opacity-40 transition-all active:scale-95 ${small ? "text-[10px] px-2 py-1" : "text-xs px-3 py-1.5"}`}
      style={{ background: bg }}
    >
      {children}
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [tab,      setTab]      = useState<Tab>("deposits");
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [stats,    setStats]    = useState<Stats>(ZERO_STATS);

  const [busy,       setBusy]       = useState<Record<string, boolean>>({});
  const [userSearch, setUserSearch] = useState("");
  const [balModal,   setBalModal]   = useState<{ user: UserRow; amount: string } | null>(null);
  const [loadingDep, setLoadingDep] = useState(false);
  const [loadingUsr, setLoadingUsr] = useState(false);
  const [loadingStt, setLoadingStt] = useState(false);

  /* ── Admin guard — email-based ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { navigate("/", { replace: true }); return; }
      const { data } = await supabase
        .from("admins").select("email").eq("email", user.email).single();
      if (!data) { navigate("/", { replace: true }); return; }
      setIsAdmin(true);
      setAdminEmail(user.email);
      setAuthDone(true);
    })();
  }, [navigate]);

  /* ── Data loaders ── */
  const loadDeposits = useCallback(async () => {
    setLoadingDep(true);
    const { data } = await supabase
      .from("deposits")
      .select("id, amount, tx_hash, screenshot_url, status, created_at, user_id, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    setDeposits((data ?? []) as unknown as DepositRow[]);
    setLoadingDep(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsr(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, balance, total_deposit, total_withdrawn, referral_code, created_at, role")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as UserRow[]);
    setLoadingUsr(false);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStt(true);
    const [
      { count: totalUsers },
      { data: depApproved },
      { count: pendingDeposits },
      { data: wdApproved },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("deposits").select("amount").eq("status", "approved"),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("amount").eq("status", "approved"),
    ]);
    setStats({
      totalUsers:     totalUsers ?? 0,
      totalDeposits:  (depApproved ?? []).reduce((s, r) => s + (r.amount ?? 0), 0),
      pendingDeposits: pendingDeposits ?? 0,
      totalWithdrawn: (wdApproved ?? []).reduce((s, r) => s + (r.amount ?? 0), 0),
    });
    setLoadingStt(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadDeposits();
    loadUsers();
    loadStats();
  }, [isAdmin, loadDeposits, loadUsers, loadStats]);

  /* ── Actions ── */
  const setBusyK = (k: string, v: boolean) => setBusy(p => ({ ...p, [k]: v }));

  async function approveDeposit(dep: DepositRow) {
    setBusyK(dep.id, true);
    const { error: e1 } = await supabase.from("deposits").update({
      status: "approved", approved_at: new Date().toISOString(),
    }).eq("id", dep.id);
    if (!e1) {
      await supabase.rpc("increment_balance", { uid: dep.user_id, inc: dep.amount });
    }
    setBusyK(dep.id, false);
    if (e1) { toast.error(e1.message); return; }
    toast.success("Deposit approved ✓ Balance updated");
    loadDeposits(); loadStats();
  }

  async function rejectDeposit(id: string) {
    setBusyK(id + "_r", true);
    const { error } = await supabase.from("deposits")
      .update({ status: "rejected", rejected_at: new Date().toISOString() }).eq("id", id);
    setBusyK(id + "_r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit rejected");
    loadDeposits();
  }

  async function updateBalance() {
    if (!balModal) return;
    const inc = parseFloat(balModal.amount);
    if (isNaN(inc)) { toast.error("Enter a valid number (e.g. 50 or -20)"); return; }
    setBusyK("bal_" + balModal.user.id, true);
    const { error } = await supabase.rpc("increment_balance", { uid: balModal.user.id, inc });
    setBusyK("bal_" + balModal.user.id, false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Balance ${inc >= 0 ? "+" : ""}${inc} applied ✓`);
    setBalModal(null);
    loadUsers(); loadStats();
  }

  function openScreenshot(dep: DepositRow) {
    const url = dep.screenshot_url
      || (dep.tx_hash?.startsWith("http") ? dep.tx_hash : null);
    if (url) { window.open(url, "_blank"); return; }
    if (dep.tx_hash && !dep.tx_hash.startsWith("http")) {
      const { data } = supabase.storage.from("deposits").getPublicUrl(dep.tx_hash);
      window.open(data.publicUrl, "_blank");
    }
  }

  const hasScreenshot = (dep: DepositRow) =>
    !!(dep.screenshot_url || dep.tx_hash);

  /* ── Loading / auth guard ── */
  if (!authDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FA" }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!isAdmin) return null;

  const filteredUsers = users.filter(u =>
    !userSearch
      || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
      || (u.full_name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "deposits", label: "Deposits",  Icon: DollarSign },
    { id: "users",    label: "Users",     Icon: Users },
    { id: "stats",    label: "Stats",     Icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: "#F8F9FA" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />

      {/* ── Balance Edit Modal ── */}
      {balModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl mx-4">
            <h3 className="text-sm font-bold mb-1" style={{ color: B }}>Edit Balance</h3>
            <p className="text-xs text-gray-400 mb-4">{balModal.user.email}</p>
            <p className="text-xs text-gray-500 mb-1">Current: <span className="font-bold text-green-600">${(balModal.user.balance ?? 0).toFixed(2)}</span></p>
            <input
              type="number"
              autoFocus
              placeholder="Enter amount (e.g. 50 or -20)"
              value={balModal.amount}
              onChange={e => setBalModal(m => m ? { ...m, amount: e.target.value } : null)}
              onKeyDown={e => { if (e.key === "Enter") updateBalance(); if (e.key === "Escape") setBalModal(null); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 mb-4"
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
        <div className="flex gap-2 mb-5">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors"
              style={tab === id
                ? { background: B, color: "white" }
                : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }
              }
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ─────────── TAB 1: DEPOSITS ─────────── */}
        {tab === "deposits" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>
                All Deposits <span className="text-gray-400 font-normal">({deposits.length})</span>
              </p>
              <button onClick={loadDeposits} disabled={loadingDep}
                className="p-1.5 rounded-lg hover:bg-white text-gray-400 transition-colors">
                <RefreshCw size={14} className={loadingDep ? "animate-spin" : ""} />
              </button>
            </div>

            {deposits.length === 0 && !loadingDep && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">
                No deposits yet
              </div>
            )}

            <div className="space-y-3">
              {deposits.map(dep => {
                const email = dep.profiles?.email ?? "—";
                const name  = dep.profiles?.full_name;
                const isPending = dep.status === "pending";
                return (
                  <div key={dep.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        {/* User */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: B }}>
                            {name ?? email}
                          </p>
                          <Badge status={dep.status} />
                        </div>
                        {name && <p className="text-xs text-gray-400">{email}</p>}

                        {/* Amount */}
                        <p className="text-xl font-bold" style={{ color: G }}>${dep.amount.toFixed(2)}</p>

                        {/* TX Hash */}
                        {dep.tx_hash && !dep.tx_hash.startsWith("http") && (
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-[220px]">
                            TX: {dep.tx_hash}
                          </p>
                        )}

                        {/* Date */}
                        <p className="text-[11px] text-gray-400">
                          {new Date(dep.created_at).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                        {hasScreenshot(dep) && (
                          <Btn color="gray" small onClick={() => openScreenshot(dep)}>
                            <ExternalLink size={10} /> View
                          </Btn>
                        )}
                        {isPending && (
                          <div className="flex gap-1.5">
                            <Btn color="green" small disabled={busy[dep.id]} onClick={() => approveDeposit(dep)}>
                              <Check size={10} /> Approve
                            </Btn>
                            <Btn color="red" small disabled={busy[dep.id + "_r"]} onClick={() => rejectDeposit(dep.id)}>
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

        {/* ─────────── TAB 2: USERS ─────────── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>
                All Users <span className="text-gray-400 font-normal">({filteredUsers.length})</span>
              </p>
              <button onClick={loadUsers} disabled={loadingUsr}
                className="p-1.5 rounded-lg hover:bg-white text-gray-400 transition-colors">
                <RefreshCw size={14} className={loadingUsr ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            {filteredUsers.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">
                No users found
              </div>
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
                            {u.full_name ?? u.email ?? "—"}
                          </p>
                          {u.role === "admin" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF2F2", color: R }}>ADMIN</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{u.email ?? "—"}</p>
                        <p className="text-[10px] text-gray-300 font-mono">UID: {shortUid}</p>
                      </div>
                      <p className="text-xl font-bold flex-shrink-0" style={{ color: G }}>
                        ${(u.balance ?? 0).toFixed(2)}
                      </p>
                    </div>

                    {/* Stats Row */}
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

                    {/* Joined + Edit Balance */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400">
                        Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </p>
                      <Btn color="blue" small onClick={() => setBalModal({ user: u, amount: "" })}>
                        <Edit2 size={10} /> Edit Balance
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────── TAB 3: STATS ─────────── */}
        {tab === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: B }}>Platform Stats</p>
              <button onClick={loadStats} disabled={loadingStt}
                className="p-1.5 rounded-lg hover:bg-white text-gray-400 transition-colors">
                <RefreshCw size={14} className={loadingStt ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Users",
                  value: stats.totalUsers.toString(),
                  icon: <Users size={20} />,
                  color: B, bg: "#EFF6FF",
                },
                {
                  label: "Total Deposits",
                  value: `$${stats.totalDeposits.toFixed(2)}`,
                  icon: <DollarSign size={20} />,
                  color: G, bg: "#F0FDF4",
                  sub: "approved only",
                },
                {
                  label: "Pending Deposits",
                  value: stats.pendingDeposits.toString(),
                  icon: <DollarSign size={20} />,
                  color: "#D97706", bg: "#FFFBEB",
                  sub: "awaiting review",
                },
                {
                  label: "Total Withdrawn",
                  value: `$${stats.totalWithdrawn.toFixed(2)}`,
                  icon: <BarChart3 size={20} />,
                  color: R, bg: "#FEF2F2",
                  sub: "approved only",
                },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <p className="text-2xl font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
