import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../App";

const networks = [
  { name: "TRC20", address: "TXaBcDeFgHiJkLmNoPqRsTuVwXyZ123456" },
  { name: "ERC20", address: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd" },
  { name: "BEP20", address: "bnb1abcdefghijklmnopqrstuvwxyz123456789" },
];

export default function Deposit() {
  const [, setLocation] = useLocation();
  const [activeNet, setActiveNet] = useState(networks[0]);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [popup, setPopup] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNet.address);
    console.log('address copied', activeNet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    console.log('deposit submit', { network: activeNet.name, amount });
    setPopup(true);
    setTimeout(() => setPopup(false), 2500);
  };

  return (
    <div className="min-h-screen" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Deposit submitted successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button onClick={() => { console.log('back clicked'); setLocation('/'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Deposit</h1>
      </div>

      {/* Network Tabs */}
      <div className="flex gap-2 px-4 mb-5">
        {networks.map(net => (
          <button
            key={net.name}
            onClick={() => setActiveNet(net)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeNet.name === net.name ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {net.name}
          </button>
        ))}
      </div>

      {/* QR Code Placeholder */}
      <div className="mx-4 bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
        <div className="w-40 h-40 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({length: 25}).map((_, i) => (
              <div key={i} className={`w-5 h-5 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-800' : 'bg-white'}`} />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-1">Scan to get address</p>
        <p className="text-xs font-mono text-slate-700 break-all px-2">{activeNet.address.substring(0, 20)}...</p>
        <button
          onClick={handleCopy}
          className="mt-3 flex items-center gap-2 mx-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl"
        >
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy Address"}
        </button>
      </div>

      {/* Amount Input */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-5">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
        <input
          type="number"
          placeholder="Enter deposit amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 text-base"
        />
      </div>

      <div className="px-4">
        <button
          onClick={handleSubmit}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-lg"
        >
          Submit Deposit
        </button>
      </div>
    </div>
  );
}
