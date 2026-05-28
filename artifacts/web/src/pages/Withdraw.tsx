import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { testUser, TEST_MODE } from "../App";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [popup, setPopup] = useState(false);

  const fee = 1;
  const receive = Math.max(0, parseFloat(amount || "0") - fee).toFixed(2);

  const handleSubmit = () => {
    if (!address || !amount) return;
    console.log('withdraw submit', { address, amount });
    setPopup(true);
    setTimeout(() => setPopup(false), 2500);
    setAddress("");
    setAmount("");
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Withdrawal request submitted!
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm">
        <button onClick={() => { console.log('back'); setLocation('/my'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Withdraw</h1>
      </div>

      <div className="mx-4 mt-4 rounded-2xl p-4 text-white shadow-md mb-5" style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-2xl font-bold">${testUser.balance.toFixed(2)} USDT</p>
      </div>

      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Wallet Address (TRC20)</label>
          <input
            type="text"
            placeholder="Enter TRC20 wallet address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-500 text-base"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
          <input
            type="number"
            placeholder="Minimum 10 USDT"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-500 text-base"
          />
        </div>
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Network Fee</span>
            <span className="text-slate-700 font-medium">{fee} USDT</span>
          </div>
          <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1.5">
            <span>You Receive</span>
            <span className="text-blue-600 font-bold">{receive} USDT</span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <button
          onClick={handleSubmit}
          disabled={!address || !amount}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg"
        >
          Submit Withdrawal
        </button>
      </div>
    </div>
  );
}
