import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { testUser, TEST_MODE } from "../App";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [popup, setPopup] = useState(false);

  const handleSubmit = () => {
    if (!address || !amount) return;
    console.log('withdraw submit', { address, amount });
    setPopup(true);
    setTimeout(() => setPopup(false), 2500);
    setAddress("");
    setAmount("");
  };

  const fee = 1;
  const receive = Math.max(0, parseFloat(amount || "0") - fee).toFixed(2);

  return (
    <div className="min-h-screen" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Withdrawal request submitted!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button onClick={() => { console.log('back clicked'); setLocation('/mine'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Withdraw</h1>
      </div>

      {/* Available Balance */}
      <div className="mx-4 rounded-2xl p-4 text-white shadow-md mb-5" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-2xl font-bold">${testUser.balance.toFixed(2)}</p>
      </div>

      {/* Form */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Wallet Address (TRC20)</label>
          <input
            type="text"
            placeholder="Enter TRC20 address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 text-base"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 text-base"
          />
        </div>

        {/* Fee Info */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Network Fee</span>
            <span className="text-slate-700 font-medium">{fee} USDT</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>You Receive</span>
            <span className="text-emerald-600 font-bold">{receive} USDT</span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <button
          onClick={handleSubmit}
          disabled={!address || !amount}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg"
        >
          Submit Withdrawal
        </button>
      </div>
    </div>
  );
}
