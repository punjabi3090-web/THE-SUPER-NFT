import { useState } from "react";
import { ArrowLeft, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance, TEST_MODE } from "../App";

const quickAmounts = [10, 50, 100, 500];
const FEE = 1;

const TRC20_REGEX = /^T[A-Za-z1-9]{33}$/;

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { balance, withdraws, requestWithdraw } = useBalance();

  const [address, setAddress]   = useState("");
  const [amount, setAmount]     = useState("");
  const [popup, setPopup]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"withdraw" | "records">("withdraw");

  const numAmount   = parseFloat(amount || "0");
  const receive     = Math.max(0, numAmount - FEE).toFixed(2);
  const insufficient = numAmount > balance;
  const invalidAddr  = address.length > 0 && !TRC20_REGEX.test(address);

  const showPopup = (msg: string) => {
    setPopup(msg);
    setTimeout(() => setPopup(null), 3000);
  };

  const handleSubmit = () => {
    if (!address.trim())   { showPopup("❌ Please enter wallet address"); return; }
    if (!numAmount || numAmount <= 0) { showPopup("❌ Please enter amount"); return; }

    const result = requestWithdraw(numAmount, address.trim());
    if (result === 'min')          { showPopup("⚠️ Minimum withdrawal is $10 USDT"); return; }
    if (result === 'invalid_addr') { showPopup("❌ Invalid TRC20 address format"); return; }
    if (result === 'insufficient') { showPopup("❌ Insufficient balance"); return; }

    showPopup("✅ Withdrawal submitted! Pending admin approval.");
    setAddress("");
    setAmount("");
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Toast popup */}
      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm max-w-xs text-center">
          {popup}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/assets')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Withdraw</h1>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "withdraw" ? "bg-emerald-500 text-white" : "text-slate-500"}`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "records" ? "bg-emerald-500 text-white" : "text-slate-500"}`}
        >
          Records ({withdraws.length})
        </button>
      </div>

      {activeTab === "withdraw" ? (
        <>
          {/* Balance card */}
          <div className="mx-4 rounded-2xl p-4 text-white shadow-md mb-4" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
            <p className="text-xs opacity-60 mt-1">USDT</p>
          </div>

          {/* Info banner */}
          <div className="mx-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
            <p className="font-semibold mb-0.5">⏳ Manual Processing</p>
            <p>Withdrawals are reviewed by admin and processed within 1-24 hours.</p>
          </div>

          {/* Form */}
          <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-4">
            {/* Address */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Wallet Address (TRC20 / USDT)
              </label>
              <input
                type="text"
                placeholder="T... (34 characters)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 outline-none text-sm font-mono ${
                  invalidAddr ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-emerald-500"
                }`}
              />
              {invalidAddr && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
                  <AlertCircle size={12} /> Must start with T and be 34 characters (TRC20 format)
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
              <div className="flex gap-2 mb-3">
                {quickAmounts.map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                      amount === String(q)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    ${q}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Min $10 USDT"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 outline-none text-sm ${
                  insufficient ? "border-red-400" : "border-slate-200 focus:border-emerald-500"
                }`}
              />
              {insufficient && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
                  <AlertCircle size={12} /> Insufficient balance
                </p>
              )}
            </div>

            {/* Fee breakdown */}
            {numAmount >= 10 && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Amount</span>
                  <span className="text-slate-700 font-medium">${numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Network Fee</span>
                  <span className="text-slate-700 font-medium">${FEE}.00</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-200 pt-1.5">
                  <span className="text-slate-600">You Receive</span>
                  <span className="text-emerald-600">${receive}</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pb-8">
            <button
              onClick={handleSubmit}
              disabled={insufficient || invalidAddr || !address || !amount || numAmount < 10}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl shadow-lg"
            >
              Submit Withdrawal Request
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">Pending admin approval · 1-24 hours</p>
          </div>
        </>
      ) : (
        <div className="px-4 pb-6">
          {withdraws.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">No withdrawal records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdraws.map(w => (
                <div key={w.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                  w.status === 'pending'  ? 'border-orange-400' :
                  w.status === 'approved' ? 'border-emerald-400' : 'border-red-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-800">${w.amount.toFixed(2)}</p>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      w.status === 'pending'  ? 'bg-orange-100 text-orange-700' :
                      w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {w.status === 'pending'  && <><Clock size={11} /> Pending</>}
                      {w.status === 'approved' && <><CheckCircle size={11} /> Approved</>}
                      {w.status === 'rejected' && <><XCircle size={11} /> Rejected</>}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fee: ${w.fee} · {new Date(w.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                    To: {w.address.slice(0, 18)}...
                  </p>
                  {w.adminNote && (
                    <p className="text-xs mt-1.5 bg-slate-50 px-2 py-1 rounded-lg text-slate-500 italic">
                      {w.status === 'approved' ? `TX: ${w.adminNote}` : `Reason: ${w.adminNote}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
