import { useState } from "react";
import { ArrowLeft, Copy, Check, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { TEST_MODE } from "../App";

const networks = [
  { name: "TRC20", address: "TXaBcDeFgHiJkLmNoPqRsTuVwXyZ123456" },
  { name: "ERC20", address: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd" },
  { name: "BEP20", address: "bnb1abcdefghijklmnopqrstuvwxyz12345678" },
];
const quickAmounts = [10, 50, 100, 500];

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { balance, deposits, addDeposit } = useBalance();
  const [activeNet, setActiveNet] = useState(networks[0]);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [popup, setPopup] = useState<"success" | "error" | null>(null);
  const [activeTab, setActiveTab] = useState<"deposit" | "records">("deposit");

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNet.address);
    console.log('address copied', activeNet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setPopup("error"); setTimeout(() => setPopup(null), 2500); return; }
    console.log('deposit submit', { network: activeNet.name, amount: num });
    addDeposit(num, activeNet.name);
    setPopup("success");
    setAmount("");
    setTimeout(() => setPopup(null), 2500);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

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

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => { console.log('back'); setLocation('/assets'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Deposit</h1>
        <div className="ml-auto text-sm text-slate-700 font-semibold">
          Balance: ${balance.toFixed(2)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "deposit" ? "bg-[#1E3A8A] text-white" : "text-slate-500"}`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "records" ? "bg-[#1E3A8A] text-white" : "text-slate-500"}`}
        >
          Records ({deposits.length})
        </button>
      </div>

      {activeTab === "deposit" ? (
        <>
          {/* Network Selector */}
          <div className="flex gap-2 px-4 mb-4">
            {networks.map(net => (
              <button
                key={net.name}
                onClick={() => setActiveNet(net)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeNet.name === net.name ? "bg-[#1E3A8A] text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {net.name}
              </button>
            ))}
          </div>

          {/* Address Card */}
          <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4 text-center">
            <div className="w-36 h-36 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <div className="grid grid-cols-7 gap-0.5 p-2">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${[0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,10,17,24,31].includes(i) ? "bg-slate-800" : "bg-white"}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-1">Deposit address ({activeNet.name})</p>
            <p className="text-xs font-mono text-slate-600 break-all px-2 mb-3">{activeNet.address.substring(0, 26)}...</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 mx-auto bg-[#EFF6FF] hover:bg-[#BFDBFE] text-[#1E3A8A] text-sm font-semibold px-5 py-2 rounded-full"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied!" : "Copy Address"}
            </button>
          </div>

          {/* Amount Input */}
          <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
            {/* Quick buttons */}
            <div className="flex gap-2 mb-3">
              {quickAmounts.map(q => (
                <button
                  key={q}
                  onClick={() => { setAmount(String(q)); console.log('quick amount', q); }}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    amount === String(q) ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  ${q}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-slate-400 text-base"
              />
              {amount && (
                <button onClick={() => setAmount("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">✕</button>
              )}
            </div>
          </div>

          <div className="px-4 pb-6">
            <button
              onClick={handleSubmit}
              className="w-full text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2" style={{ background: '#1E3A8A' }}
            >
              <Plus size={18} /> Confirm Deposit
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 pb-6">
          {deposits.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">No deposit records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map(d => (
                <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">${d.amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{d.network} · {new Date(d.date).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
