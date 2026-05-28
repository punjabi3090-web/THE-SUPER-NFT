import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck, LogOut, ArrowLeft, CheckCircle, XCircle,
  Plus, Minus, ClipboardList, BarChart3, ArrowUpDown
} from "lucide-react";
import { useBalance, isAdminAuthed, setAdminAuthed, clearAdminAuth } from "../App";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

type Tab = 'dashboard' | 'withdrawals' | 'balance' | 'logs';

type ConfirmState = {
  title: string;
  message: string;
  danger?: boolean;
  onConfirm: () => void;
} | null;

export default function AdminPanel() {
  const [, setLocation]   = useLocation();
  const [authed, setAuthed]       = useState(isAdminAuthed());
  const [pwInput, setPwInput]     = useState("");
  const [pwError, setPwError]     = useState("");
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [confirm, setConfirm]     = useState<ConfirmState>(null);

  // Withdrawal modals
  const [approveId, setApproveId] = useState<string | null>(null);
  const [txHash, setTxHash]       = useState("");
  const [rejectId, setRejectId]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Balance control
  const [balAmt, setBalAmt]       = useState("");
  const [balReason, setBalReason] = useState("");

  const {
    balance, withdraws, orders, stakes, adminLogs,
    approveWithdraw, rejectWithdraw,
    adminAddBalance, adminDeductBalance,
  } = useBalance();

  // Session expiry check every 60s
  useEffect(() => {
    const t = setInterval(() => { if (!isAdminAuthed()) setAuthed(false); }, 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────

  const handleLogin = () => {
    if (!ADMIN_SECRET) {
      setPwError("VITE_ADMIN_SECRET is not configured. Add it in Replit Secrets.");
      return;
    }
    if (pwInput === ADMIN_SECRET) {
      setAdminAuthed();
      setAuthed(true);
      setPwError("");
      setPwInput("");
    } else {
      setPwError("Incorrect password. Access denied.");
      setPwInput("");
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    setAuthed(false);
    setLocation('/');
  };

  // ── Withdrawal actions ────────────────────────────────────────────────────

  const openApproveConfirm = () => {
    if (!approveId || !txHash.trim()) return;
    setConfirm({
      title: "Confirm Withdrawal Approval",
      message: `Approve this withdrawal?\nTX Hash: ${txHash.slice(0, 20)}...`,
      onConfirm: () => {
        approveWithdraw(approveId, txHash.trim());
        setApproveId(null);
        setTxHash("");
        setConfirm(null);
      }
    });
  };

  const openRejectConfirm = () => {
    if (!rejectId || !rejectReason.trim()) return;
    setConfirm({
      title: "Confirm Withdrawal Rejection",
      message: `Reject this withdrawal? Balance will be refunded.\nReason: "${rejectReason}"`,
      danger: true,
      onConfirm: () => {
        rejectWithdraw(rejectId, rejectReason.trim());
        setRejectId(null);
        setRejectReason("");
        setConfirm(null);
      }
    });
  };

  // ── Balance actions ────────────────────────────────────────────────────────

  const openAddConfirm = () => {
    const amt = parseFloat(balAmt);
    if (!amt || amt <= 0 || !balReason.trim()) return;
    setConfirm({
      title: "Add Balance",
      message: `Add $${amt.toFixed(2)} USDT to user wallet?\nReason: "${balReason}"`,
      onConfirm: () => {
        adminAddBalance(amt, balReason.trim());
        setBalAmt(""); setBalReason("");
        setConfirm(null);
      }
    });
  };

  const openDeductConfirm = () => {
    const amt = parseFloat(balAmt);
    if (!amt || amt <= 0 || !balReason.trim()) return;
    setConfirm({
      title: "⚠️ Deduct Balance",
      message: `Deduct $${amt.toFixed(2)} USDT from user wallet? This cannot be undone.\nReason: "${balReason}"`,
      danger: true,
      onConfirm: () => {
        adminDeductBalance(amt, balReason.trim());
        setBalAmt(""); setBalReason("");
        setConfirm(null);
      }
    });
  };

  const pendingWithdraws = withdraws.filter(w => w.status === 'pending');
  const activeStakes     = stakes.filter(s => s.status === 'active');

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Access</h1>
        <p className="text-slate-400 text-sm mb-8">THE SUPER NFT · Restricted Area</p>

        <div className="w-full bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">
            Admin Password
          </label>
          <input
            type="password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(""); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 mb-3 placeholder:text-slate-500"
            autoFocus
          />
          {pwError && (
            <p className="text-red-400 text-xs mb-3 bg-red-900/20 px-3 py-2 rounded-lg">{pwError}</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Unlock Admin Panel
          </button>
        </div>

        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-slate-400 text-sm mt-6 hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Back to app
        </button>
      </div>
    );
  }

  // ── Admin panel ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50">

      {/* Global confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 text-base mb-2">{confirm.title}</h3>
            <p className="text-slate-500 text-sm mb-6 whitespace-pre-line">{confirm.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirm.onConfirm}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white ${confirm.danger ? 'bg-red-500' : 'bg-emerald-500'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve TX modal */}
      {approveId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Enter Transaction Hash</h3>
            <p className="text-xs text-slate-400 mb-4">Enter the blockchain TX hash for this withdrawal</p>
            <input
              type="text"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder="TX hash (e.g. 3a1b2c...)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-4 font-mono"
            />
            <div className="flex gap-3">
              <button onClick={() => { setApproveId(null); setTxHash(""); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={openApproveConfirm} disabled={!txHash.trim()} className="flex-1 py-2.5 rounded-xl bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm">Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">Rejection Reason</h3>
            <p className="text-xs text-slate-400 mb-4">Amount will be refunded to user balance</p>
            <input
              type="text"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={openRejectConfirm} disabled={!rejectReason.trim()} className="flex-1 py-2.5 rounded-xl bg-red-500 disabled:opacity-40 text-white font-bold text-sm">Next →</button>
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-300 text-xs font-medium hover:text-white"
        >
          <LogOut size={14} /> End Session
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-slate-100 relative">
        {([
          { key: 'dashboard',   label: 'Dashboard',    Icon: BarChart3,    badge: 0 },
          { key: 'withdrawals', label: 'Withdrawals',  Icon: ArrowUpDown,  badge: pendingWithdraws.length },
          { key: 'balance',     label: 'Balance',      Icon: Plus,         badge: 0 },
          { key: 'logs',        label: 'Logs',         Icon: ClipboardList,badge: 0 },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex-1 py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors relative ${
              tab === t.key ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'
            }`}
          >
            <t.Icon size={15} />
            {t.label}
            {t.badge > 0 && (
              <span className="absolute top-1.5 right-3 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 pb-10">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'User Balance',         value: `$${balance.toFixed(2)}`, color: 'text-emerald-600', icon: '💰' },
                { label: 'Pending Withdrawals',  value: pendingWithdraws.length,  color: 'text-orange-500',  icon: '⏳' },
                { label: 'Active Stakes',        value: activeStakes.length,      color: 'text-blue-600',    icon: '📈' },
                { label: 'Total Orders',         value: orders.length,            color: 'text-purple-600',  icon: '🖼️' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {pendingWithdraws.length > 0 && (
              <button
                onClick={() => setTab('withdrawals')}
                className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left"
              >
                <p className="text-orange-700 font-semibold text-sm">
                  ⚠️ {pendingWithdraws.length} withdrawal{pendingWithdraws.length > 1 ? 's' : ''} awaiting approval
                </p>
                <p className="text-orange-500 text-xs mt-1 font-medium">Tap to review →</p>
              </button>
            )}
            {pendingWithdraws.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-emerald-700 text-sm font-medium">✅ All withdrawals processed</p>
              </div>
            )}
          </div>
        )}

        {/* ── WITHDRAWALS ── */}
        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdraws.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">No withdrawal requests yet</p>
              </div>
            )}
            {withdraws.map(w => (
              <div
                key={w.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                  w.status === 'pending'  ? 'border-orange-400' :
                  w.status === 'approved' ? 'border-emerald-400' : 'border-red-400'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-800">${w.amount.toFixed(2)} USDT</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(w.date).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    w.status === 'pending'  ? 'bg-orange-100 text-orange-700' :
                    w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {w.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono truncate mb-2">To: {w.address}</p>
                {w.adminNote && (
                  <p className="text-xs text-slate-400 italic mb-2 bg-slate-50 px-2 py-1 rounded-lg">
                    {w.status === 'approved' ? `TX: ${w.adminNote}` : `Reason: ${w.adminNote}`}
                  </p>
                )}
                {w.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setApproveId(w.id); setTxHash(""); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2 rounded-xl text-sm font-semibold"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { setRejectId(w.id); setRejectReason(""); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── BALANCE CONTROL ── */}
        {tab === 'balance' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-5 text-white text-center shadow-md">
              <p className="text-sm opacity-80 mb-1">Current User Balance</p>
              <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              <p className="text-xs opacity-60">USDT</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-slate-700">Balance Adjustment</p>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  value={balAmt}
                  onChange={e => setBalAmt(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Reason (required)</label>
                <input
                  type="text"
                  value={balReason}
                  onChange={e => setBalReason(e.target.value)}
                  placeholder="e.g. Bonus reward, Correction"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={openAddConfirm}
                  disabled={!balAmt || parseFloat(balAmt) <= 0 || !balReason.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm"
                >
                  <Plus size={15} /> Add
                </button>
                <button
                  onClick={openDeductConfirm}
                  disabled={!balAmt || parseFloat(balAmt) <= 0 || !balReason.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm"
                >
                  <Minus size={15} /> Deduct
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN LOGS ── */}
        {tab === 'logs' && (
          <div className="space-y-2">
            {adminLogs.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-4xl mb-2">📝</p>
                <p className="text-sm">No admin actions recorded yet</p>
              </div>
            )}
            {adminLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl p-3 shadow-sm flex items-start gap-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 leading-tight ${
                  log.action.includes('APPROVED') ? 'bg-emerald-100 text-emerald-700' :
                  log.action.includes('REJECTED') ? 'bg-red-100 text-red-700'     :
                  log.action.includes('ADDED')    ? 'bg-blue-100 text-blue-700'    :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
