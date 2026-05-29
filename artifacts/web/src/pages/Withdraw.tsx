import { useState } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

const quickAmounts = [10, 50, 100, 500];

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { balance, requestWithdraw, refresh, user } = useBalance();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup]   = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;

  const showPopup = (msg: string) => {
    setPopup(msg);
    setTimeout(() => setPopup(null), 3500);
  };

  const handleSubmit = async () => {
    if (!numAmount || numAmount <= 0) { showPopup("❌ Please enter amount"); return; }
    setLoading(true);
    try {
      const result = await requestWithdraw(numAmount);
      refresh();
      if (result === 'disabled')         showPopup("⚠️ Withdrawals are currently disabled");
      else if (result === 'no_auth')     showPopup("⚠️ Please bind Google Authenticator first");
      else if (result === 'no_address')  showPopup("⚠️ Please bind your withdrawal address first");
      else if (result === 'delay')       showPopup("⚠️ Address was just bound — wait 24 hours before withdrawing");
      else if (result === 'time_restricted') showPopup("⚠️ Withdrawals are outside the allowed time window");
      else if (result === 'min')         showPopup("⚠️ Minimum withdrawal is $10 USDT");
      else if (result === 'max')         showPopup("⚠️ Maximum withdrawal limit exceeded");
      else if (result === 'insufficient') showPopup("❌ Insufficient balance");
      else { showPopup("✅ Withdrawal submitted! Pending admin approval."); setAmount(""); }
    } catch {
      showPopup("❌ Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const wdAddress = user?.withdrawalAddress;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
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
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)} USDT</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-2">Withdrawal Address (TRC20)</p>
          {wdAddress ? (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-600 font-mono break-all">{wdAddress}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700">No address bound</p>
                <button onClick={() => setLocation('/security')} className="text-xs text-blue-600 underline mt-0.5">
                  Bind in Security →
                </button>
              </div>
            </div>
          )}
        </div>

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
          <button onClick={handleSubmit} disabled={!numAmount || numAmount <= 0 || !wdAddress || loading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg disabled:opacity-50 transition-all"
            style={{ background: '#1E3A8A' }}>
            {loading ? "Submitting..." : "Withdraw USDT"}
          </button>
          <p className="text-xs text-slate-400 text-center">Min: $10 USDT · Processed within 24h</p>
        </div>
      </div>
    </div>
  );
}
