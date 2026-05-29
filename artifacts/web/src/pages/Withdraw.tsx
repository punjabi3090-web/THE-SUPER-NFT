import { useState } from "react";
import { ArrowLeft, AlertCircle, Shield, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { getCurrentUser, updateUser, addToUserHistory, getCurrentUserId } from "../lib/store";

const quickAmounts = [10, 50, 100, 500];

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { balance, requestWithdraw, refresh, user } = useBalance();
  const [amount, setAmount] = useState("");
  const [popup, setPopup]   = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;

  const showPopup = (msg: string) => {
    setPopup(msg);
    setTimeout(() => setPopup(null), 3500);
  };

  const handleSubmit = () => {
    if (!numAmount || numAmount <= 0) { showPopup("❌ Please enter amount"); return; }
    const result = requestWithdraw(numAmount);
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
        {/* Balance */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)} USDT</p>
        </div>

        {/* Withdrawal address */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${wdAddress ? 'border-emerald-400' : 'border-orange-400'}`}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className={wdAddress ? 'text-emerald-500' : 'text-orange-500'} />
            <p className="text-sm font-semibold text-slate-700">Withdrawal Address (TRC20)</p>
          </div>
          {wdAddress ? (
            <p className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-2 rounded-lg break-all">{wdAddress}</p>
          ) : (
            <div>
              <p className="text-xs text-orange-600 mb-2">No address bound. Please set it in Security settings.</p>
              <button onClick={() => setLocation('/security')} className="text-xs font-semibold px-4 py-2 rounded-lg text-white" style={{ background: '#1E3A8A' }}>
                Bind Address →
              </button>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Amount (USDT)</p>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-base"
          />
          <div className="flex gap-2 mt-3">
            {quickAmounts.map(q => (
              <button key={q} onClick={() => setAmount(q.toString())}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-[#BFDBFE] text-slate-600 hover:bg-[#EFF6FF]">
                ${q}
              </button>
            ))}
          </div>
          {numAmount > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              You will receive: <strong>${Math.max(0, numAmount - 1).toFixed(2)} USDT</strong>
              <span className="text-slate-400 ml-1">(after $1 fee)</span>
            </p>
          )}
        </div>

        <button onClick={handleSubmit}
          disabled={!wdAddress || numAmount <= 0}
          className="w-full py-3 rounded-xl text-white font-bold text-base shadow-md disabled:opacity-40"
          style={{ background: '#1E3A8A' }}>
          Submit Withdrawal Request
        </button>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs text-slate-500 font-semibold">📋 Withdrawal Notes</p>
          <p className="text-xs text-slate-400">• Minimum: $10 USDT · Fee: $1</p>
          <p className="text-xs text-slate-400">• Requests are processed within 24 hours</p>
          <p className="text-xs text-slate-400">• Make sure your address is correct — cannot be reversed</p>
          {!user?.googleAuthBound && <p className="text-xs text-orange-500">• Bind Google Auth to enable withdrawals</p>}
        </div>
      </div>
    </div>
  );
}
