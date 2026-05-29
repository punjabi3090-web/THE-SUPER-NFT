import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

const networks = [
  { name: "TRC20", address: "TXaBcDeFgHiJkLmNoPqRsTuVwXyZ123456" },
  { name: "ERC20", address: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd" },
  { name: "BEP20", address: "bnb1abcdefghijklmnopqrstuvwxyz12345678" },
];

export default function Deposit() {
  const [, setLocation]   = useLocation();
  const { addDeposit, balance, refresh } = useBalance();
  const [activeNet, setActiveNet] = useState(networks[0]);
  const [amount, setAmount]       = useState("");
  const [copied, setCopied]       = useState(false);
  const [popup, setPopup]         = useState<"success" | "error" | null>(null);

  const numAmount = parseFloat(amount) || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!numAmount || numAmount <= 0) { setPopup("error"); setTimeout(() => setPopup(null), 2500); return; }
    addDeposit(numAmount, activeNet.name);
    refresh();
    setPopup("success");
    setAmount("");
    setTimeout(() => setPopup(null), 2500);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {popup === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm" style={{ background: '#1E3A8A' }}>
          ✅ Deposit successful! Balance updated.
        </div>
      )}
      {popup === "error" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ❌ Enter a valid amount.
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

        {/* Network selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Select Network</p>
          <div className="flex gap-2">
            {networks.map(net => (
              <button key={net.name} onClick={() => setActiveNet(net)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${activeNet.name === net.name ? 'text-white border-[#1E3A8A]' : 'text-slate-500 border-slate-200'}`}
                style={activeNet.name === net.name ? { background: '#1E3A8A' } : {}}>
                {net.name}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-2">Deposit Address ({activeNet.name})</p>
          <div className="bg-[#EFF6FF] rounded-xl p-3 border border-[#BFDBFE] flex items-center gap-2">
            <p className="flex-1 text-xs text-slate-700 font-mono break-all">{activeNet.address}</p>
            <button onClick={handleCopy} style={{ color: '#1E3A8A' }} className="shrink-0">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-red-500 mt-2">⚠️ Only send {activeNet.name} USDT to this address</p>
        </div>

        {/* Amount input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Confirm Deposit Amount</p>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (USDT)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-base"
          />
          {numAmount > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              You will receive: <strong>${numAmount.toFixed(2)} USDT</strong>
              {numAmount >= 50 && <span className="text-green-600 ml-2">+ 10% bonus 🎁</span>}
            </p>
          )}
          <button onClick={handleSubmit} className="w-full mt-4 py-3 rounded-xl text-white font-bold text-base shadow-md" style={{ background: '#1E3A8A' }}>
            Confirm Deposit
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs text-amber-700 font-semibold mb-2">📋 Instructions</p>
          <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
            <li>Transfer USDT to the address above</li>
            <li>Enter the exact amount and click Confirm</li>
            <li>Balance updates immediately in demo mode</li>
            <li>Deposits ≥$50 earn 10% bonus reward</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
