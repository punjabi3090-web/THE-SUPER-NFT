import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { getPlatformSettings, getCurrentUserId, submitWithdrawalRequest } from "../lib/api";

const quickAmounts = [10, 50, 100, 500];

export default function Withdraw() {
  const [, setLocation]           = useLocation();
  const { balance, refresh, user } = useBalance();
  const uid                       = getCurrentUserId();
  const [amount, setAmount]       = useState("");
  const [network, setNetwork]     = useState<"BEP20" | "TRC20">("TRC20");
  const [loading, setLoading]     = useState(false);
  const [popup, setPopup]         = useState<string | null>(null);

  const [wdMinHour, setWdMinHour] = useState(0);
  const [wdMaxHour, setWdMaxHour] = useState(23);
  const [timingLoaded, setTimingLoaded] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(s => {
      if (s.withdraw_min_hours !== undefined) setWdMinHour(parseInt(s.withdraw_min_hours, 10) || 0);
      if (s.withdraw_max_hours !== undefined) setWdMaxHour(parseInt(s.withdraw_max_hours, 10) || 23);
    }).catch(() => {}).finally(() => setTimingLoaded(true));
  }, []);

  const numAmount = parseFloat(amount) || 0;

  const showPopup = (msg: string) => {
    setPopup(msg);
    setTimeout(() => setPopup(null), 3500);
  };

  const currentHour = new Date().getHours();
  const allowed = timingLoaded ? (currentHour >= wdMinHour && currentHour < wdMaxHour) : true;

  const bep20Addr = user?.bep20Address;
  const trc20Addr = user?.trc20Address;
  const selectedAddr = network === "BEP20" ? bep20Addr : trc20Addr;

  const handleSubmit = async () => {
    if (!uid) { showPopup("❌ Please login first"); return; }
    if (!numAmount || numAmount <= 0) { showPopup("❌ Please enter amount"); return; }
    if (!allowed) { showPopup(`⚠️ Withdrawals open from ${wdMinHour}:00 to ${wdMaxHour}:00`); return; }
    if (!selectedAddr) { showPopup("⚠️ Please bind your " + network + " withdrawal address first"); return; }
    setLoading(true);
    try {
      const result = await submitWithdrawalRequest(uid, numAmount, network);
      refresh();
      if (result === "no_address") showPopup(`⚠️ Please bind your ${network} address in Security Center`);
      else if (result === "min")    showPopup("⚠️ Minimum withdrawal is $10 USDT");
      else if (result === "blocked") showPopup("⚠️ Your account is blocked. Contact support.");
      else if (result === "insufficient") showPopup("❌ Insufficient balance");
      else { showPopup("✅ Withdrawal submitted! Pending admin approval."); setAmount(""); }
    } catch {
      showPopup("❌ Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-sm text-white max-w-xs text-center"
          style={{ background: popup.startsWith('✅') ? '#1E3A8A' : '#EA4335' }}>
          {popup}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/assets')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Withdraw USDT</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Balance */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)} USDT</p>
        </div>

        {/* Timing */}
        {timingLoaded && (
          <div className={`rounded-2xl p-3 flex items-start gap-2 border ${allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
            <Clock size={15} className={`mt-0.5 shrink-0 ${allowed ? 'text-emerald-600' : 'text-orange-500'}`} />
            <div>
              <p className={`text-xs font-semibold ${allowed ? 'text-emerald-700' : 'text-orange-700'}`}>
                {allowed ? '✅ Withdrawals are open now' : '⏰ Withdrawals currently closed'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Window: {fmt(wdMinHour)} – {fmt(wdMaxHour)} · Current: {fmt(currentHour)}
              </p>
            </div>
          </div>
        )}

        {/* Network selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Select Network</p>
          <div className="flex gap-3">
            {(["BEP20", "TRC20"] as const).map(net => (
              <button key={net} onClick={() => setNetwork(net)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${network === net ? 'text-white border-[#1E3A8A]' : 'text-slate-500 border-slate-200 bg-slate-50'}`}
                style={network === net ? { background: '#1E3A8A' } : {}}>
                {net === "BEP20" ? "🟡 BEP20" : "🔴 TRC20"}
              </button>
            ))}
          </div>
        </div>

        {/* BEP20 address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-2">🟡 BEP20 Withdrawal Address</p>
          {bep20Addr ? (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-600 font-mono break-all">{bep20Addr}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700">No BEP20 address bound</p>
                <button onClick={() => setLocation('/security')} className="text-xs text-blue-600 underline mt-0.5">
                  Bind in Security →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TRC20 address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-2">🔴 TRC20 Withdrawal Address</p>
          {trc20Addr ? (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-600 font-mono break-all">{trc20Addr}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700">No TRC20 address bound</p>
                <button onClick={() => setLocation('/security')} className="text-xs text-blue-600 underline mt-0.5">
                  Bind in Security →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected address preview */}
        {selectedAddr && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-semibold mb-1">Withdrawing to ({network}):</p>
            <p className="text-xs text-blue-800 font-mono break-all">{selectedAddr}</p>
          </div>
        )}

        {/* Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs text-slate-500 font-semibold">Amount (USDT)</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (min $10)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-lg font-bold" />
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="py-2 rounded-xl text-sm font-semibold border border-[#BFDBFE] text-[#1E3A8A] hover:bg-[#EFF6FF]">
                ${a}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit}
            disabled={!numAmount || numAmount <= 0 || !selectedAddr || loading || !allowed}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg disabled:opacity-50 transition-all"
            style={{ background: '#1E3A8A' }}>
            {loading ? "Submitting..." : !allowed ? "Outside Withdrawal Hours" : `Withdraw via ${network}`}
          </button>
          <p className="text-xs text-slate-400 text-center">Min: $10 USDT · Processed within 24h</p>
        </div>
      </div>
    </div>
  );
}
