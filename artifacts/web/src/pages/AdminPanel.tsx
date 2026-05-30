import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck, LogOut, ArrowLeft, CheckCircle, XCircle, Plus,
  ClipboardList, BarChart3, ArrowUpDown, Users, Bell, Gift, Settings,
  Trash2, Lock, Unlock, RefreshCw, Send, KeyRound,
} from "lucide-react";
import {
  isAdminLoggedIn, adminLogin, adminLogout,
  getAllUsers, getAdminNotifications, getAdminLogs, getAdminWithdrawals,
  approveWithdrawal, rejectWithdrawal, editUserBalance,
  blockUser, deleteUser, sendAdminNotification, sendAirdrop,
  updateUserReferralCode, changeAdminPassword,
  type User, type WithdrawalRequest, type AdminNotif, type AdminLog,
} from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'members' | 'withdrawals' | 'notifications' | 'airdrop' | 'settings' | 'logs';

// ── AdminPanel ────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(isAdminLoggedIn());
  const [tab, setTab] = useState<TabKey>('dashboard');

  // Login form
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Data
  const [users, setUsers]     = useState<User[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [notifs, setNotifs]   = useState<AdminNotif[]>([]);
  const [logs, setLogs]       = useState<AdminLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modal — Approve
  const [approveId, setApproveId] = useState<number | null>(null);
  const [txHash, setTxHash]       = useState("");
  // Modal — Reject
  const [rejectId, setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // Modal — Balance edit
  const [balUserId, setBalUserId] = useState<string | null>(null);
  const [balAmt, setBalAmt]       = useState("");
  const [balReason, setBalReason] = useState("");
  // Modal — Delete confirm
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  // Modal — Referral code edit
  const [refUserId, setRefUserId]   = useState<string | null>(null);
  const [newRefCode, setNewRefCode] = useState("");

  // Notifications form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg]     = useState("");
  const [notifType, setNotifType]   = useState("announcement");
  const [notifSent, setNotifSent]   = useState(false);

  // Airdrop
  const [airdropAmt, setAirdropAmt]   = useState("");
  const [airdropSent, setAirdropSent] = useState(false);

  // Settings — Change Password
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPw, setNewAdminPw]       = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [pwSaved, setPwSaved]             = useState(false);
  const [pwErr, setPwErr]                 = useState("");

  // Computed
  const pending    = requests.filter(r => r.status === 'pending');
  const totalBal   = users.reduce((s, u) => s + u.walletBalance, 0);
  const totalDep   = users.reduce((s, u) => s + u.totalDeposit, 0);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const doRefresh = useCallback(async () => {
    if (!isAdminLoggedIn()) return;
    setDataLoading(true);
    try {
      const [u, r, n, l] = await Promise.all([
        getAllUsers(),
        getAdminWithdrawals(),
        getAdminNotifications(),
        getAdminLogs(),
      ]);
      setUsers(u);
      setRequests(r);
      setNotifs(n);
      setLogs(l);
    } catch { /* token may have expired */ }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => {
    if (authed) doRefresh();
  }, [authed, doRefresh]);

  // ── Admin login ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginErr(""); setLoginLoading(true);
    const ok = await adminLogin(email, pw);
    setLoginLoading(false);
    if (!ok) { setLoginErr("Invalid admin email or password"); return; }
    setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-slate-400 text-sm mb-8">THE SUPER NFT · Restricted Area</p>
        <div className="w-full bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500"
            placeholder="Admin email" />
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setLoginErr(""); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500"
            placeholder="Password" autoFocus />
          {loginErr && <p className="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded-lg">{loginErr}</p>}
          <button onClick={handleLogin} disabled={loginLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-3 rounded-xl disabled:opacity-60">
            {loginLoading ? "Verifying..." : "Unlock Admin Panel"}
          </button>
          <p className="text-slate-500 text-xs text-center">Authorized admins only</p>
        </div>
        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-slate-400 text-sm mt-6 hover:text-slate-200">
          <ArrowLeft size={16} /> Back to app
        </button>
      </div>
    );
  }

  const TABS = [
    { key: 'dashboard',     label: 'Stats',       Icon: BarChart3,    badge: 0 },
    { key: 'members',       label: 'Members',     Icon: Users,        badge: 0 },
    { key: 'withdrawals',   label: 'Withdrawals', Icon: ArrowUpDown,  badge: pending.length },
    { key: 'notifications', label: 'Notify',      Icon: Bell,         badge: 0 },
    { key: 'airdrop',       label: 'Airdrop',     Icon: Gift,         badge: 0 },
    { key: 'settings',      label: 'Settings',    Icon: Settings,     badge: 0 },
    { key: 'logs',          label: 'Logs',        Icon: ClipboardList,badge: 0 },
  ] as const;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Modal — Approve Withdrawal */}
      {approveId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-4">Enter TX Hash</h3>
            <input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4 font-mono" />
            <div className="flex gap-3">
              <button onClick={() => { setApproveId(null); setTxHash(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={async () => {
                if (!txHash.trim()) return;
                await approveWithdrawal(approveId, txHash.trim());
                setApproveId(null); setTxHash("");
                await doRefresh(); showToast("✅ Withdrawal approved!");
              }} disabled={!txHash.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Reject Withdrawal */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-4">Rejection Reason</h3>
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={async () => {
                if (!rejectReason.trim()) return;
                await rejectWithdrawal(rejectId, rejectReason.trim());
                setRejectId(null); setRejectReason("");
                await doRefresh(); showToast("❌ Withdrawal rejected, balance refunded");
              }} disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 disabled:opacity-40 text-white font-bold text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Balance edit */}
      {balUserId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-4">Edit Balance</h3>
            <p className="text-xs text-slate-400 mb-3">User: {users.find(u => u.userId === balUserId)?.name}</p>
            <input type="number" value={balAmt} onChange={e => setBalAmt(e.target.value)} placeholder="Amount"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-2" />
            <input value={balReason} onChange={e => setBalReason(e.target.value)} placeholder="Reason (required)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setBalUserId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
              <button onClick={async () => {
                const a = parseFloat(balAmt);
                if (!a || !balReason.trim()) return;
                await editUserBalance(balUserId, a, 'add', balReason.trim());
                setBalUserId(null); setBalAmt(""); setBalReason("");
                await doRefresh(); showToast(`✅ Added $${a} to balance`);
              }} disabled={!balAmt || !balReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm">+ Add</button>
              <button onClick={async () => {
                const a = parseFloat(balAmt);
                if (!a || !balReason.trim()) return;
                await editUserBalance(balUserId, a, 'sub', balReason.trim());
                setBalUserId(null); setBalAmt(""); setBalReason("");
                await doRefresh(); showToast(`✅ Deducted $${a} from balance`);
              }} disabled={!balAmt || !balReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 disabled:opacity-40 text-white font-bold text-sm">- Deduct</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-red-600 mb-2">Delete User?</h3>
            <p className="text-slate-500 text-sm mb-6">Permanently delete {users.find(u => u.userId === deleteId)?.name}. Cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
              <button onClick={async () => {
                await deleteUser(deleteId);
                setDeleteId(null);
                await doRefresh(); showToast("🗑️ User deleted");
              }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Referral code edit */}
      {refUserId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Edit Referral Code</h3>
            <p className="text-xs text-slate-400 mb-4">User: {users.find(u => u.userId === refUserId)?.email}</p>
            <input value={newRefCode} onChange={e => setNewRefCode(e.target.value.toUpperCase().replace(/\s/g,''))}
              placeholder="e.g. SP8iGr9" maxLength={20}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4 font-mono tracking-wider" />
            <div className="flex gap-3">
              <button onClick={() => { setRefUserId(null); setNewRefCode(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
              <button onClick={async () => {
                if (!newRefCode.trim()) return;
                const result = await updateUserReferralCode(refUserId, newRefCode.trim());
                if (result === 'taken') { showToast("❌ Code already taken by another user"); return; }
                if (result === 'not_found') { showToast("❌ User not found"); return; }
                setRefUserId(null); setNewRefCode("");
                await doRefresh(); showToast("✅ Referral code updated!");
              }} disabled={!newRefCode.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span className="text-white font-bold text-sm">Admin Panel</span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { doRefresh(); showToast("Refreshed!"); }} className="text-slate-400 hover:text-white">
            <RefreshCw size={15} className={dataLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { adminLogout(); setAuthed(false); setLocation('/'); }}
            className="flex items-center gap-1.5 text-slate-300 text-xs font-medium hover:text-white">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as TabKey)}
            className={`flex-none py-3 px-3 text-[10px] font-semibold flex flex-col items-center gap-1 relative min-w-[52px] ${tab === t.key ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>
            <t.Icon size={15} />
            {t.label}
            {t.badge > 0 && <span className="absolute top-1.5 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="p-4 pb-10 space-y-4">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Members', value: `${users.length} (${users.filter(u => u.totalDeposit > 0).length} deposited)`, color: 'text-blue-600', icon: '👥' },
                { label: 'Total Balance (All Users)', value: `$${totalBal.toFixed(2)}`, color: 'text-emerald-600', icon: '💰' },
                { label: 'Total Deposits', value: `$${totalDep.toFixed(2)}`, color: 'text-purple-600', icon: '📥' },
                { label: 'Pending Withdrawals', value: `${pending.length} requests`, color: 'text-orange-500', icon: '⏳' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {pending.length > 0 && (
              <button onClick={() => setTab('withdrawals')} className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left">
                <p className="text-orange-700 font-semibold text-sm">⚠️ {pending.length} withdrawal{pending.length > 1 ? 's' : ''} awaiting approval</p>
                <p className="text-orange-500 text-xs mt-1">Tap to review →</p>
              </button>
            )}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-semibold text-slate-700 text-sm mb-3">Recent Members</p>
              {users.length === 0
                ? <p className="text-slate-400 text-xs">{dataLoading ? "Loading..." : "No members yet"}</p>
                : users.slice(0, 5).map(u => (
                  <div key={u.userId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">${u.walletBalance.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Lv {u.level}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              {users.length} total members · {users.filter(u => u.isBlocked).length} blocked · {dataLoading ? "Loading..." : "DB synced"}
            </div>
            {users.length === 0 && !dataLoading && (
              <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-2">👥</p><p className="text-sm">No members yet.</p></div>
            )}
            {users.map(u => (
              <div key={u.userId} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${u.isBlocked ? 'border-red-400' : 'border-emerald-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                    <p className="text-xs text-slate-300">ID: {u.userId}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {u.isBlocked ? 'BLOCKED' : `Level ${u.level}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs font-bold text-emerald-600">${u.walletBalance.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Balance</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs font-bold text-blue-600">${u.totalDeposit.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Deposited</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs font-bold text-red-500">${u.totalWithdraw.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Withdrawn</p>
                  </div>
                </div>
                {u.withdrawalAddress && <p className="text-xs text-slate-400 font-mono truncate mb-2">Addr: {u.withdrawalAddress}</p>}
                <p className="text-xs text-slate-400 mb-2">
                  Ref: <span className="font-mono font-bold text-blue-600">{u.referralCode}</span>
                  {u.referredBy && <span className="ml-2 text-slate-300">← {u.referredBy}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { setBalUserId(u.userId); setBalAmt(""); setBalReason(""); }}
                    className="flex items-center gap-1 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                    <Plus size={12} /> Balance
                  </button>
                  <button onClick={() => { setRefUserId(u.userId); setNewRefCode(u.referralCode); }}
                    className="flex items-center gap-1 bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                    🔑 Ref Code
                  </button>
                  <button onClick={async () => {
                    await blockUser(u.userId);
                    await doRefresh();
                    showToast(u.isBlocked ? '✅ User unblocked' : '🔒 User blocked');
                  }} className={`flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg font-semibold ${u.isBlocked ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {u.isBlocked ? <><Unlock size={12} /> Unblock</> : <><Lock size={12} /> Block</>}
                  </button>
                  <button onClick={() => setDeleteId(u.userId)}
                    className="flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold ml-auto">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── WITHDRAWALS ── */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-2">📋</p><p className="text-sm">{dataLoading ? "Loading..." : "No withdrawal requests yet"}</p></div>
            )}
            {requests.map(w => (
              <div key={w.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${w.status === 'pending' ? 'border-orange-400' : w.status === 'approved' ? 'border-emerald-400' : 'border-red-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-800">${w.amount.toFixed(2)} USDT</p>
                    <p className="text-xs text-slate-500">{w.userName} · {w.userEmail}</p>
                    <p className="text-xs text-slate-400">{new Date(w.requestDate).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${w.status === 'pending' ? 'bg-orange-100 text-orange-700' : w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {w.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono truncate mb-2">To: {w.address}</p>
                {w.txHash && <p className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded-lg mb-2 font-mono truncate">TX: {w.txHash}</p>}
                {w.rejectReason && <p className="text-xs text-red-400 italic bg-red-50 px-2 py-1 rounded-lg mb-2">Reason: {w.rejectReason}</p>}
                {w.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setApproveId(w.id); setTxHash(""); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2 rounded-xl text-sm font-semibold">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => { setRejectId(w.id); setRejectReason(""); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-bold text-slate-800">Send Announcement to All Users</p>
              <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Title"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
              <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Message..." rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
              <select value={notifType} onChange={e => setNotifType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="announcement">📣 Announcement</option>
                <option value="maintenance">🔧 Maintenance</option>
                <option value="promo">🎉 Promotion</option>
                <option value="security">🔐 Security Alert</option>
              </select>
              {notifSent && <p className="text-emerald-600 text-sm font-semibold text-center">✅ Notification sent!</p>}
              <button onClick={async () => {
                if (!notifTitle.trim() || !notifMsg.trim()) return;
                await sendAdminNotification(notifTitle.trim(), notifMsg.trim(), notifType);
                setNotifTitle(""); setNotifMsg(""); setNotifSent(true);
                await doRefresh();
                setTimeout(() => setNotifSent(false), 3000);
              }} disabled={!notifTitle.trim() || !notifMsg.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold">
                <Send size={16} /> Send Notification
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-semibold text-slate-700 text-sm mb-3">Sent Notifications ({notifs.length})</p>
              {notifs.length === 0
                ? <p className="text-slate-400 text-xs">{dataLoading ? "Loading..." : "No notifications sent yet"}</p>
                : notifs.slice(0, 10).map(n => (
                  <div key={n.id} className="py-2 border-b border-slate-50 last:border-0">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-400 truncate">{n.message}</p>
                    <p className="text-[10px] text-slate-300">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── AIRDROP ── */}
        {tab === 'airdrop' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-5 text-white text-center">
              <p className="text-4xl mb-2">🪂</p>
              <p className="font-bold text-xl">Send Airdrop to All Users</p>
              <p className="text-sm opacity-80">{users.length} users will receive the airdrop</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <input type="number" value={airdropAmt} onChange={e => setAirdropAmt(e.target.value)}
                placeholder="Amount per user (USDT)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
              {airdropAmt && parseFloat(airdropAmt) > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm">
                  <p className="text-purple-700 font-semibold">Total: ${(parseFloat(airdropAmt) * users.length).toFixed(2)} USDT</p>
                  <p className="text-purple-500 text-xs">({users.length} users × ${parseFloat(airdropAmt).toFixed(2)} each)</p>
                </div>
              )}
              {airdropSent && <p className="text-emerald-600 text-sm font-semibold text-center">✅ Airdrop sent!</p>}
              <button onClick={async () => {
                const a = parseFloat(airdropAmt);
                if (!a || a <= 0 || users.length === 0) return;
                await sendAirdrop(a);
                setAirdropAmt(""); setAirdropSent(true);
                await doRefresh();
                setTimeout(() => setAirdropSent(false), 3000);
              }} disabled={!airdropAmt || parseFloat(airdropAmt) <= 0 || users.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold">
                🪂 Send Airdrop
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {/* Change Admin Credentials */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-blue-600" />
                <p className="font-bold text-slate-800">Admin Credentials</p>
              </div>
              <p className="text-xs text-slate-400">Change the admin email and/or password for panel access.</p>
              <input
                value={newAdminEmail}
                onChange={e => { setNewAdminEmail(e.target.value); setPwErr(""); }}
                placeholder="New admin email (leave blank to keep)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input type="password"
                value={newAdminPw}
                onChange={e => { setNewAdminPw(e.target.value); setPwErr(""); }}
                placeholder="New password (leave blank to keep)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input type="password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwErr(""); }}
                placeholder="Confirm new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
              {pwErr && <p className="text-red-500 text-xs">{pwErr}</p>}
              {pwSaved && <p className="text-emerald-600 text-xs font-semibold">✅ Credentials updated! Use new details next login.</p>}
              <button onClick={async () => {
                setPwErr("");
                if (newAdminPw && newAdminPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
                if (newAdminPw && newAdminPw.length < 6) { setPwErr("Password must be at least 6 characters"); return; }
                if (!newAdminPw && !newAdminEmail) { setPwErr("Enter new email or password to change"); return; }
                try {
                  await changeAdminPassword(newAdminPw || "", newAdminEmail || undefined);
                  setNewAdminPw(""); setConfirmPw(""); setNewAdminEmail("");
                  setPwSaved(true);
                  setTimeout(() => setPwSaved(false), 4000);
                } catch (e: unknown) {
                  setPwErr(e instanceof Error ? e.message : "Failed to update");
                }
              }} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                Save Credentials
              </button>
            </div>

            {/* Info */}
            <div className="bg-slate-100 rounded-2xl p-4 text-xs text-slate-500 space-y-1">
              <p>🔒 All user data is stored in PostgreSQL database</p>
              <p>🌍 Users from any device are visible in this panel</p>
              <p>🔑 Admin session uses secure tokens (expires on logout)</p>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <div className="space-y-2">
            {logs.length === 0 && (
              <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-2">📋</p><p className="text-sm">{dataLoading ? "Loading..." : "No logs yet"}</p></div>
            )}
            {logs.map(l => (
              <div key={l.id} className="bg-white rounded-xl p-3 shadow-sm text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-slate-700">{l.action}</span>
                  <span className="text-slate-400">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-500">Target: {l.target}</p>
                {Number(l.amount) > 0 && <p className="text-emerald-600">Amount: ${Number(l.amount).toFixed(2)}</p>}
                {l.details && <p className="text-slate-400 mt-0.5">{l.details}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
