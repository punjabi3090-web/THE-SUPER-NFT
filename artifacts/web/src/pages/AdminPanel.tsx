import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck, LogOut, ArrowLeft, CheckCircle, XCircle, Plus,
  ClipboardList, BarChart3, ArrowUpDown, Users, Bell, Gift,
  Settings, Trash2, Lock, Unlock, RefreshCw, Send, KeyRound,
  Download, TrendingUp,
} from "lucide-react";
import {
  isAdminLoggedIn, adminLogin, adminLogout,
  getAllUsers, getAdminNotifications, getAdminLogs, getAdminWithdrawals,
  approveWithdrawal, rejectWithdrawal, editUserBalance,
  blockUser, deleteUser, sendAdminNotification, sendAirdrop,
  updateUserReferralCode, changeAdminPassword,
  getAdminSettings, saveAdminSettings, adminForgotPassword, adminResetPassword,
  getAdminDeposits, approveDeposit, rejectDeposit, addUserIncome,
  type User, type WithdrawalRequest, type AdminNotif, type AdminLog, type DepositRequest,
} from "../lib/api";

type TabKey = 'dashboard' | 'members' | 'withdrawals' | 'deposits' | 'notifications' | 'airdrop' | 'settings' | 'logs';

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(isAdminLoggedIn());
  const [tab, setTab] = useState<TabKey>('dashboard');

  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const [users, setUsers]     = useState<User[]>([]);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [notifs, setNotifs]   = useState<AdminNotif[]>([]);
  const [logs, setLogs]       = useState<AdminLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals — Withdrawal
  const [approveId, setApproveId] = useState<number | null>(null);
  const [txHash, setTxHash]       = useState("");
  const [rejectId, setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modals — Deposit
  const [depRejectId, setDepRejectId]       = useState<number | null>(null);
  const [depRejectReason, setDepRejectReason] = useState("");

  // Modals — Balance
  const [balUserId, setBalUserId] = useState<string | null>(null);
  const [balAmt, setBalAmt]       = useState("");
  const [balReason, setBalReason] = useState("");

  // Modals — Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modals — Referral code
  const [refUserId, setRefUserId]   = useState<string | null>(null);
  const [newRefCode, setNewRefCode] = useState("");

  // Modals — Income
  const [incomeUserId, setIncomeUserId] = useState<string | null>(null);
  const [incomeAmt, setIncomeAmt]       = useState("");

  // Notifications
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg]     = useState("");
  const [notifType, setNotifType]   = useState("announcement");
  const [notifSent, setNotifSent]   = useState(false);

  // Airdrop
  const [airdropAmt, setAirdropAmt]   = useState("");
  const [airdropSent, setAirdropSent] = useState(false);

  // Settings — Credentials
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPw, setNewAdminPw]       = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [pwSaved, setPwSaved]             = useState(false);
  const [pwErr, setPwErr]                 = useState("");

  // Forgot password
  const [fpStep, setFpStep]           = useState<'login' | 'forgot' | 'otp'>('login');
  const [fpEmail, setFpEmail]         = useState("");
  const [fpOtp, setFpOtp]             = useState("");
  const [fpNewPw, setFpNewPw]         = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpErr, setFpErr]             = useState("");
  const [fpLoading, setFpLoading]     = useState(false);

  // Platform settings
  const [bep20, setBep20]             = useState("");
  const [trc20, setTrc20]             = useState("");
  const [depositPct, setDepositPct]   = useState("10");
  const [referralPct, setReferralPct] = useState("5");
  const [reservePct, setReservePct]   = useState("3");
  const [extraPct, setExtraPct]       = useState("2");
  const [wdMinHours, setWdMinHours]   = useState("0");
  const [wdMaxHours, setWdMaxHours]   = useState("23");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const pending        = requests.filter(r => r.status === 'pending');
  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const totalBal       = users.reduce((s, u) => s + u.walletBalance, 0);
  const totalDep       = users.reduce((s, u) => s + u.totalDeposit, 0);

  const doRefresh = useCallback(async () => {
    if (!isAdminLoggedIn()) return;
    setDataLoading(true);
    try {
      const [u, r, d, n, l] = await Promise.all([
        getAllUsers(),
        getAdminWithdrawals(),
        getAdminDeposits(),
        getAdminNotifications(),
        getAdminLogs(),
      ]);
      setUsers(u);
      setRequests(r);
      setDeposits(d);
      setNotifs(n);
      setLogs(l);
    } catch { /* token may have expired */ }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => {
    if (authed) doRefresh();
  }, [authed, doRefresh]);

  useEffect(() => {
    if (!authed) return;
    getAdminSettings().then(s => {
      if (s.platform_bep20_address) setBep20(s.platform_bep20_address);
      if (s.platform_trc20_address) setTrc20(s.platform_trc20_address);
      if (s.deposit_bonus_pct)      setDepositPct(s.deposit_bonus_pct);
      if (s.referral_reward_pct)    setReferralPct(s.referral_reward_pct);
      if (s.reserve_reward_pct)     setReservePct(s.reserve_reward_pct);
      if (s.extra_bonus_pct)        setExtraPct(s.extra_bonus_pct);
      if (s.withdraw_min_hours !== undefined) setWdMinHours(s.withdraw_min_hours);
      if (s.withdraw_max_hours !== undefined) setWdMaxHours(s.withdraw_max_hours);
    }).catch(() => {});
  }, [authed]);

  const handleLogin = async () => {
    setLoginErr(""); setLoginLoading(true);
    const ok = await adminLogin(email, pw);
    setLoginLoading(false);
    if (!ok) { setLoginErr("Invalid admin email or password"); return; }
    setAuthed(true);
  };

  // ── Login screen ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-slate-400 text-sm mb-8">THE SUPER NFT · Restricted Area</p>

        {fpStep === 'login' && (
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
            <button onClick={() => { setFpStep('forgot'); setFpErr(""); setFpEmail(email); }}
              className="w-full text-center text-slate-400 text-xs hover:text-slate-200 pt-1">
              Forgot Password?
            </button>
          </div>
        )}

        {fpStep === 'forgot' && (
          <div className="w-full bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-3">
            <p className="text-white font-semibold text-sm">Reset Admin Password</p>
            <p className="text-slate-400 text-xs">Enter your admin email. We'll send a 6-digit OTP.</p>
            <input type="email" value={fpEmail} onChange={e => { setFpEmail(e.target.value); setFpErr(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500"
              placeholder="Admin email" autoFocus />
            {fpErr && <p className="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded-lg">{fpErr}</p>}
            <button onClick={async () => {
              if (!fpEmail.trim()) { setFpErr("Enter your admin email"); return; }
              setFpLoading(true); setFpErr("");
              const r = await adminForgotPassword(fpEmail.trim());
              setFpLoading(false);
              if (r === 'not_admin') { setFpErr("This email is not an admin account"); return; }
              setFpStep('otp');
            }} disabled={fpLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-60">
              {fpLoading ? "Sending OTP..." : "Send OTP to Email"}
            </button>
            <button onClick={() => { setFpStep('login'); setFpErr(""); }}
              className="w-full text-center text-slate-400 text-xs hover:text-slate-200 pt-1">← Back to Login</button>
          </div>
        )}

        {fpStep === 'otp' && (
          <div className="w-full bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-3">
            <p className="text-white font-semibold text-sm">Enter OTP & New Password</p>
            <p className="text-slate-400 text-xs">OTP sent to <span className="text-emerald-400">{fpEmail}</span></p>
            <input type="text" value={fpOtp} onChange={e => { setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFpErr(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500 text-center text-xl tracking-[12px] font-bold"
              placeholder="000000" maxLength={6} autoFocus />
            <input type="password" value={fpNewPw} onChange={e => { setFpNewPw(e.target.value); setFpErr(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500"
              placeholder="New password (min 6 chars)" />
            <input type="password" value={fpConfirmPw} onChange={e => { setFpConfirmPw(e.target.value); setFpErr(""); }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-500"
              placeholder="Confirm new password" />
            {fpErr && <p className="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded-lg">{fpErr}</p>}
            <button onClick={async () => {
              if (fpOtp.length !== 6) { setFpErr("Enter the 6-digit OTP"); return; }
              if (!fpNewPw || fpNewPw.length < 6) { setFpErr("Password must be at least 6 characters"); return; }
              if (fpNewPw !== fpConfirmPw) { setFpErr("Passwords do not match"); return; }
              setFpLoading(true); setFpErr("");
              const r = await adminResetPassword(fpEmail, fpOtp, fpNewPw);
              setFpLoading(false);
              if (r === 'expired') { setFpErr("OTP expired. Request a new one."); setFpStep('forgot'); return; }
              if (r === 'invalid') { setFpErr("Incorrect OTP. Try again."); return; }
              setFpStep('login'); setFpOtp(""); setFpNewPw(""); setFpConfirmPw("");
              setLoginErr("✅ Password reset! Login with new password.");
            }} disabled={fpLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-3 rounded-xl disabled:opacity-60">
              {fpLoading ? "Resetting..." : "Reset Password"}
            </button>
            <div className="flex gap-3">
              <button onClick={() => { setFpStep('forgot'); setFpOtp(""); setFpErr(""); }}
                className="flex-1 text-center text-slate-400 text-xs hover:text-slate-200">Resend OTP</button>
              <button onClick={() => { setFpStep('login'); setFpErr(""); }}
                className="flex-1 text-center text-slate-400 text-xs hover:text-slate-200">← Back to Login</button>
            </div>
          </div>
        )}

        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-slate-400 text-sm mt-6 hover:text-slate-200">
          <ArrowLeft size={16} /> Back to app
        </button>
      </div>
    );
  }

  const TABS = [
    { key: 'dashboard',     label: 'Stats',       Icon: BarChart3,    badge: 0 },
    { key: 'members',       label: 'Members',     Icon: Users,        badge: 0 },
    { key: 'withdrawals',   label: 'Withdraw',    Icon: ArrowUpDown,  badge: pending.length },
    { key: 'deposits',      label: 'Deposits',    Icon: Download,     badge: pendingDeposits.length },
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

      {/* Modal — Reject Deposit */}
      {depRejectId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-4">Deposit Rejection Reason</h3>
            <input value={depRejectReason} onChange={e => setDepRejectReason(e.target.value)} placeholder="Enter reason..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setDepRejectId(null); setDepRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={async () => {
                if (!depRejectReason.trim()) return;
                await rejectDeposit(depRejectId, depRejectReason.trim());
                setDepRejectId(null); setDepRejectReason("");
                await doRefresh(); showToast("❌ Deposit rejected");
              }} disabled={!depRejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 disabled:opacity-40 text-white font-bold text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Balance */}
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

      {/* Modal — Delete */}
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

      {/* Modal — Referral code */}
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
                setRefUserId(null); setNewRefCode("");
                await doRefresh(); showToast("✅ Referral code updated!");
              }} disabled={!newRefCode.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Income Controls */}
      {incomeUserId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Add Income</h3>
            <p className="text-xs text-slate-400 mb-4">User: {users.find(u => u.userId === incomeUserId)?.name}</p>
            <input type="number" value={incomeAmt} onChange={e => setIncomeAmt(e.target.value)}
              placeholder="Amount (USDT)" min="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4" />
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { type: 'reserve' as const, label: '📊 Reserve Income', color: 'bg-blue-500' },
                { type: 'team'    as const, label: '👥 Team Income',    color: 'bg-emerald-500' },
                { type: 'referral' as const, label: '🎁 Referral Reward', color: 'bg-purple-500' },
              ].map(({ type, label, color }) => (
                <button key={type} onClick={async () => {
                  const a = parseFloat(incomeAmt);
                  if (!a || a <= 0) { showToast("Enter a valid amount first"); return; }
                  await addUserIncome(incomeUserId, a, type);
                  setIncomeUserId(null); setIncomeAmt("");
                  await doRefresh(); showToast(`✅ $${a} ${type} income added`);
                }} disabled={!incomeAmt || parseFloat(incomeAmt) <= 0}
                  className={`${color} disabled:opacity-40 text-white text-[10px] font-bold py-2 px-1 rounded-xl leading-tight text-center`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => { setIncomeUserId(null); setIncomeAmt(""); }}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
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
                { label: 'Total Members',     value: `${users.length}`,                  color: 'text-blue-600',   icon: '👥' },
                { label: 'Total Balance',      value: `$${totalBal.toFixed(2)}`,          color: 'text-emerald-600', icon: '💰' },
                { label: 'Total Deposits',     value: `$${totalDep.toFixed(2)}`,          color: 'text-purple-600', icon: '📥' },
                { label: 'Pending Withdrawals',value: `${pending.length} requests`,       color: 'text-orange-500', icon: '⏳' },
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
            {pendingDeposits.length > 0 && (
              <button onClick={() => setTab('deposits')} className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left">
                <p className="text-blue-700 font-semibold text-sm">💰 {pendingDeposits.length} deposit{pendingDeposits.length > 1 ? 's' : ''} awaiting approval</p>
                <p className="text-blue-500 text-xs mt-1">Tap to review →</p>
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
                <div className="grid grid-cols-3 gap-2 mb-2 text-center">
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
                {/* Income */}
                <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                  <div className="bg-blue-50 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-blue-600">${(u.reserveIncome ?? 0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-400">Reserve</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-emerald-600">${(u.teamIncome ?? 0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-400">Team</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-1.5">
                    <p className="text-xs font-bold text-purple-600">${(u.activityIncome ?? 0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-400">Activity</p>
                  </div>
                </div>
                {u.bep20Address && <p className="text-[10px] text-slate-400 font-mono truncate mb-1">BEP20: {u.bep20Address}</p>}
                {u.trc20Address && <p className="text-[10px] text-slate-400 font-mono truncate mb-1">TRC20: {u.trc20Address}</p>}
                <p className="text-xs text-slate-400 mb-2">
                  Ref: <span className="font-mono font-bold text-blue-600">{u.referralCode}</span>
                  {u.referredBy && <span className="ml-2 text-slate-300">← {u.referredBy}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { setBalUserId(u.userId); setBalAmt(""); setBalReason(""); }}
                    className="flex items-center gap-1 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                    <Plus size={12} /> Balance
                  </button>
                  <button onClick={() => { setIncomeUserId(u.userId); setIncomeAmt(""); }}
                    className="flex items-center gap-1 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                    <TrendingUp size={12} /> Income
                  </button>
                  <button onClick={() => { setRefUserId(u.userId); setNewRefCode(u.referralCode); }}
                    className="flex items-center gap-1 bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                    🔑 Ref
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
                    <p className="font-bold text-slate-800">${w.amount.toFixed(2)} USDT · {w.network}</p>
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

        {/* ── DEPOSITS ── */}
        {tab === 'deposits' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              {deposits.length} total · {pendingDeposits.length} pending review
            </div>
            {deposits.length === 0 && (
              <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-2">💰</p><p className="text-sm">{dataLoading ? "Loading..." : "No deposit requests yet"}</p></div>
            )}
            {deposits.map(d => (
              <div key={d.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${d.status === 'pending' ? 'border-blue-400' : d.status === 'approved' ? 'border-emerald-400' : 'border-red-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-800">${Number(d.amount).toFixed(2)} USDT · {d.network}</p>
                    <p className="text-xs text-slate-500">{d.userName} · {d.userEmail}</p>
                    <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.status === 'pending' ? 'bg-blue-100 text-blue-700' : d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
                {d.txHash && <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-lg mb-2 truncate">TX: {d.txHash}</p>}
                {d.rejectReason && <p className="text-xs text-red-400 italic bg-red-50 px-2 py-1 rounded-lg mb-2">Reason: {d.rejectReason}</p>}
                {d.processedAt && <p className="text-[10px] text-slate-400">Processed: {new Date(d.processedAt).toLocaleString()}</p>}
                {d.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => {
                      await approveDeposit(d.id);
                      await doRefresh();
                      showToast(`✅ Deposit of $${Number(d.amount).toFixed(2)} approved!`);
                    }} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2 rounded-xl text-sm font-semibold">
                      <CheckCircle size={14} /> Approve & Credit
                    </button>
                    <button onClick={() => { setDepRejectId(d.id); setDepRejectReason(""); }}
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
            {/* Admin Credentials */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-blue-600" />
                <p className="font-bold text-slate-800">Admin Credentials</p>
              </div>
              <p className="text-xs text-slate-400">Change the admin email and/or password for panel access.</p>
              <input value={newAdminEmail} onChange={e => { setNewAdminEmail(e.target.value); setPwErr(""); }}
                placeholder="New admin email (leave blank to keep)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
              <input type="password" value={newAdminPw} onChange={e => { setNewAdminPw(e.target.value); setPwErr(""); }}
                placeholder="New password (leave blank to keep)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
              <input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwErr(""); }}
                placeholder="Confirm new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" />
              {pwErr && <p className="text-red-500 text-xs">{pwErr}</p>}
              {pwSaved && <p className="text-emerald-600 text-xs font-semibold">✅ Credentials updated!</p>}
              <button onClick={async () => {
                setPwErr("");
                if (newAdminPw && newAdminPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
                if (newAdminPw && newAdminPw.length < 6) { setPwErr("Password must be at least 6 characters"); return; }
                if (!newAdminPw && !newAdminEmail) { setPwErr("Enter new email or password to change"); return; }
                try {
                  await changeAdminPassword(newAdminPw || "", newAdminEmail || undefined);
                  setNewAdminPw(""); setConfirmPw(""); setNewAdminEmail("");
                  setPwSaved(true); setTimeout(() => setPwSaved(false), 4000);
                } catch (e: unknown) { setPwErr(e instanceof Error ? e.message : "Failed to update"); }
              }} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                Save Credentials
              </button>
            </div>

            {/* Platform Deposit Addresses */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💳</span>
                <p className="font-bold text-slate-800">Platform Deposit Addresses</p>
              </div>
              <p className="text-xs text-slate-400">These addresses are shown to users on the Deposit page.</p>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">🟡 BEP20 Address (BSC)</p>
                <input value={bep20} onChange={e => setBep20(e.target.value)}
                  placeholder="0x... BEP20 wallet address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-mono" />
                {bep20 && (
                  <div className="mt-2 flex justify-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(bep20)}&size=80x80&margin=4`}
                      alt="QR" className="w-[80px] h-[80px] rounded-lg border border-slate-200" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">🔴 TRC20 Address (TRON)</p>
                <input value={trc20} onChange={e => setTrc20(e.target.value)}
                  placeholder="T... TRC20 USDT address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-mono" />
                {trc20 && (
                  <div className="mt-2 flex justify-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(trc20)}&size=80x80&margin=4`}
                      alt="QR" className="w-[80px] h-[80px] rounded-lg border border-slate-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Reward Settings */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎁</span>
                <p className="font-bold text-slate-800">Reward Percentages</p>
              </div>
              {[
                { label: "Deposit Bonus %",   val: depositPct,   set: setDepositPct,   key: "deposit_bonus_pct" },
                { label: "Referral Reward %", val: referralPct,  set: setReferralPct,  key: "referral_reward_pct" },
                { label: "Reserve Reward %",  val: reservePct,   set: setReservePct,   key: "reserve_reward_pct" },
                { label: "Extra Bonus %",     val: extraPct,     set: setExtraPct,     key: "extra_bonus_pct" },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-36 shrink-0">{f.label}</label>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} min="0" max="100"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none text-right" />
                  <span className="text-slate-400 text-sm">%</span>
                </div>
              ))}
            </div>

            {/* Withdrawal Hours */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⏰</span>
                <p className="font-bold text-slate-800">Withdrawal Hours</p>
              </div>
              <p className="text-xs text-slate-400">
                Set the hour window (0–23) during which withdrawals are allowed each day.
                Users can only withdraw between Min Hour and Max Hour.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Min Hour (0–23)</label>
                  <input type="number" min="0" max="23" value={wdMinHours}
                    onChange={e => setWdMinHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none text-center font-bold" />
                  <p className="text-[10px] text-slate-400 text-center mt-1">e.g. 9 = 9:00 AM</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Max Hour (0–23)</label>
                  <input type="number" min="0" max="23" value={wdMaxHours}
                    onChange={e => setWdMaxHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none text-center font-bold" />
                  <p className="text-[10px] text-slate-400 text-center mt-1">e.g. 21 = 9:00 PM</p>
                </div>
              </div>
              {parseInt(wdMinHours) >= 0 && parseInt(wdMaxHours) >= 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
                  <p className="text-xs text-blue-700 font-semibold">
                    Window: {String(parseInt(wdMinHours)||0).padStart(2,'0')}:00 – {String(parseInt(wdMaxHours)||0).padStart(2,'0')}:00
                  </p>
                </div>
              )}
            </div>

            {/* Save All Settings */}
            <button onClick={async () => {
              setSettingsSaving(true);
              try {
                await saveAdminSettings({
                  platform_bep20_address: bep20,
                  platform_trc20_address: trc20,
                  deposit_bonus_pct: depositPct,
                  referral_reward_pct: referralPct,
                  reserve_reward_pct: reservePct,
                  extra_bonus_pct: extraPct,
                  withdraw_min_hours: wdMinHours,
                  withdraw_max_hours: wdMaxHours,
                });
                showToast("✅ Settings saved!");
              } catch {
                showToast("❌ Failed to save settings");
              } finally {
                setSettingsSaving(false);
              }
            }} disabled={settingsSaving}
              className="w-full py-3.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-white font-bold text-base shadow-md">
              {settingsSaving ? "Saving..." : "💾 Save All Settings"}
            </button>
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <div className="space-y-2">
            <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-500">
              {logs.length} recent admin actions
            </div>
            {logs.length === 0 && (
              <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-2">📋</p><p className="text-sm">{dataLoading ? "Loading..." : "No logs yet"}</p></div>
            )}
            {logs.map(l => (
              <div key={l.id} className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{l.action}</p>
                  <p className="text-[10px] text-slate-400 truncate">{l.target} · {l.details}</p>
                  <p className="text-[10px] text-slate-300">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
                {l.amount > 0 && (
                  <span className="text-xs font-bold text-emerald-600 shrink-0">${Number(l.amount).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
