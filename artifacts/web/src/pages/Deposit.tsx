import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, QrCode, Clock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import {
  getPlatformSettings, submitDepositRequest,
  getDepositHistory, getCurrentUserId, type DepositRequest,
} from "../lib/api";

const DEFAULT_BEP20 = "Loading...";
const DEFAULT_TRC20 = "Loading...";

export default function Deposit() {
  const [, setLocation]   = useLocation();
  const { balance }       = useBalance();
  const uid               = getCurrentUserId();

  const [amount, setAmount]       = useState("");
  const [txHash, setTxHash]       = useState("");
  const [copied, setCopied]       = useState(false);
  const [activeNet, setActiveNet] = useState<"BEP20" | "TRC20">("BEP20");
  const [bep20Addr, setBep20Addr] = useState(DEFAULT_BEP20);
  const [trc20Addr, setTrc20Addr] = useState(DEFAULT_TRC20);
  const [showQr, setShowQr]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory]     = useState<DepositRequest[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    getPlatformSettings()
      .then(s => {
        if (s.platform_bep20_address) setBep20Addr(s.platform_bep20_address);
        if (s.platform_trc20_address) setTrc20Addr(s.platform_trc20_address);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!uid) return;
    setHistLoading(true);
    getDepositHistory(uid)
      .then(d => setHistory(d))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [uid]);

  const currentAddress = activeNet === "BEP20" ? bep20Addr : trc20Addr;
  const numAmount = parseFloat(amount) || 0;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = () => {
    if (currentAddress === DEFAULT_BEP20 || currentAddress === DEFAULT_TRC20) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!uid) { showToast("Please login first", false); return; }
    if (!numAmount || numAmount <= 0) { showToast("Please enter a valid amount", false); return; }
    setSubmitting(true);
    try {
      const result = await submitDepositRequest({
        userId: uid,
        amount: numAmount,
        network: activeNet,
        txHash: txHash.trim() || undefined,
      });
      if (result === "ok") {
        showToast("✅ Deposit request submitted! Awaiting admin approval.");
        setAmount(""); setTxHash("");
        if (uid) {
          getDepositHistory(uid).then(d => setHistory(d)).catch(() => {});
        }
      } else {
        showToast("❌ Failed to submit. Please try again.", false);
      }
    } catch {
      showToast("❌ Network error. Please try again.", false);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) =>
    s === "approved" ? "text-emerald-700 bg-emerald-100"
    : s === "rejected" ? "text-red-700 bg-red-100"
    : "text-orange-700 bg-orange-100";

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-sm text-white max-w-xs text-center ${toast.ok ? 'bg-[#1E3A8A]' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/assets')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Deposit USDT</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Balance */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)} USDT</p>
        </div>

        {/* Network selector — only BEP20 & TRC20 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Select Network</p>
          <div className="flex gap-3">
            {(["BEP20", "TRC20"] as const).map(net => (
              <button key={net} onClick={() => { setActiveNet(net); setShowQr(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${activeNet === net ? 'text-white border-[#1E3A8A]' : 'text-slate-500 border-slate-200 bg-slate-50'}`}
                style={activeNet === net ? { background: '#1E3A8A' } : {}}>
                {net === "BEP20" ? "🟡 BEP20 (BSC)" : "🔴 TRC20 (TRON)"}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet address + QR */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Deposit Address ({activeNet})</p>
            <button onClick={() => setShowQr(v => !v)}
              className="flex items-center gap-1 text-xs text-[#1E3A8A] font-semibold">
              <QrCode size={14} /> {showQr ? "Hide QR" : "Show QR"}
            </button>
          </div>

          {showQr && currentAddress !== DEFAULT_BEP20 && currentAddress !== DEFAULT_TRC20 && (
            <div className="flex justify-center mb-3">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-block">
                {loading ? (
                  <div className="w-[150px] h-[150px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentAddress)}&size=150x150&margin=4`}
                    alt="QR Code" className="w-[150px] h-[150px] rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          <div className="bg-[#EFF6FF] rounded-xl p-3 border border-[#BFDBFE] flex items-center gap-2">
            <p className="flex-1 text-xs text-slate-700 font-mono break-all">
              {loading ? "Loading address..." : currentAddress}
            </p>
            <button onClick={handleCopy} style={{ color: '#1E3A8A' }} className="shrink-0">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-red-500 mt-2">⚠️ Only send {activeNet} USDT to this address</p>
        </div>

        {/* Amount + TX Hash + Submit */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-700">Confirm Deposit</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter deposit amount (USDT)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-base" />
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)}
            placeholder="TX Hash (Optional — paste your transaction ID)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-xs font-mono" />
          {numAmount > 0 && (
            <p className="text-xs text-slate-500">
              Deposit: <strong>${numAmount.toFixed(2)} USDT</strong> via <strong>{activeNet}</strong>
            </p>
          )}
          <button onClick={handleSubmit} disabled={submitting || !numAmount || numAmount <= 0}
            className="w-full py-3 rounded-xl text-white font-bold text-base shadow-md disabled:opacity-50"
            style={{ background: '#1E3A8A' }}>
            {submitting ? "Submitting..." : "Submit Deposit Request"}
          </button>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-semibold mb-1">📋 How it works</p>
            <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
              <li>Send USDT to the address above</li>
              <li>Enter the amount & your TX hash</li>
              <li>Submit — admin will review and approve</li>
              <li>Balance credited within 1-24 hours</li>
            </ol>
          </div>
        </div>

        {/* Deposit History */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-800">Deposit History</p>
            {histLoading && <div className="w-4 h-4 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />}
          </div>
          {history.length === 0 && !histLoading && (
            <p className="text-xs text-slate-400 text-center py-4">No deposits yet</p>
          )}
          <div className="space-y-2">
            {history.slice(0, 10).map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-300 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">${Number(d.amount).toFixed(2)} · {d.network}</p>
                    <p className="text-[10px] text-slate-400">{new Date(d.createdAt).toLocaleString()}</p>
                    {d.txHash && <p className="text-[9px] text-slate-300 font-mono truncate max-w-[160px]">TX: {d.txHash}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                    {d.status.toUpperCase()}
                  </span>
                  <ChevronRight size={12} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
