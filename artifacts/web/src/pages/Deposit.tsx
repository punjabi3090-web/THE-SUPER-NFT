import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../App";

const networks = [
  { name: "TRC20", address: "TXaBcDeFgHiJkLmNoPqRsTuVwXyZ123456" },
  { name: "ERC20", address: "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd" },
  { name: "BEP20", address: "bnb1abcdefghijklmnopqrstuvwxyz12345678" },
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
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Deposit submitted successfully!
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm">
        <button onClick={() => { console.log('back'); setLocation('/stake'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Deposit</h1>
      </div>

      <div className="flex gap-2 px-4 mt-4 mb-4">
        {networks.map(net => (
          <button
            key={net.name}
            onClick={() => setActiveNet(net)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              activeNet.name === net.name ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {net.name}
          </button>
        ))}
      </div>

      <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4 text-center">
        <div className="w-36 h-36 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-7 gap-0.5 p-2">
            {Array.from({length: 49}).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${[0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,8,15,24].includes(i) ? 'bg-slate-800' : 'bg-white'}`} />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-1">Deposit address ({activeNet.name})</p>
        <p className="text-xs font-mono text-slate-600 break-all px-2 mb-3">{activeNet.address.substring(0, 24)}...</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 mx-auto bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold px-5 py-2 rounded-full"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy Address"}
        </button>
      </div>

      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm mb-5">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Amount (USDT)</label>
        <input
          type="number"
          placeholder="Enter deposit amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-blue-500 text-base"
        />
      </div>

      <div className="px-4">
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3.5 rounded-2xl shadow-lg"
        >
          Submit Deposit
        </button>
      </div>
    </div>
  );
}
