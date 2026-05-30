import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { getPlatformSettings } from "../lib/api";

const DEFAULT_BEP20 = "bnb1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const DEFAULT_TRC20 = "TXaBcDeFgHiJkLmNoPqRsTuVwXyZ123456";
const DEFAULT_ERC20 = "0xAaBbCcDdEeFf00112233445566778899AaBbCcDd";

export default function Deposit() {
  const [, setLocation]   = useLocation();
  const { addDeposit, balance, refresh } = useBalance();
  const [amount, setAmount]       = useState("");
  const [copied, setCopied]       = useState(false);
  const [popup, setPopup]         = useState<"success" | "error" | null>(null);
  const [activeNet, setActiveNet] = useState<"BEP20" | "TRC20" | "ERC20">("BEP20");
  const [bep20Address, setBep20Address] = useState(DEFAULT_BEP20);
  const [showQr, setShowQr]       = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(true);

  useEffect(() => {
    getPlatformSettings().then(s => {
      if (s.platform_bep20_address) setBep20Address(s.platform_bep20_address);
    }).catch(() => {}).finally(() => setLoadingAddr(false));
  }, []);

  const currentAddress = activeNet === "BEP20" ? bep20Address
    : activeNet === "TRC20" ? DEFAULT_TRC20
    : DEFAULT_ERC20;

  const numAmount = parseFloat(amount) || 0;

  const depositBonusPct = 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!numAmount || numAmount <= 0) { setPopup("error"); setTimeout(() => setPopup(null), 2500); return; }
    addDeposit(numAmount, activeNet);
    refresh();
    setPopup("success");
    setAmount("");
    setTimeout(() => setPopup(null), 2500);
  };

  const networks: ("BEP20" | "TRC20" | "ERC20")[] = ["BEP20", "TRC20", "ERC20"];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {popup === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm" style={{ background: '#1E3A8A' }}>
          ✅ Deposit submitted! Balance updated.
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
              <button key={net} onClick={() => { setActiveNet(net); setShowQr(false); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${activeNet === net ? 'text-white border-[#1E3A8A]' : 'text-slate-500 border-slate-200'}`}
                style={activeNet === net ? { background: '#1E3A8A' } : {}}>
                {net}
              </button>
            ))}
          </div>
          {activeNet === "BEP20" && (
            <p className="text-[10px] text-emerald-600 font-semibold mt-2 text-center">✅ Recommended — Admin-verified address</p>
          )}
        </div>

        {/* Wallet address + QR */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Deposit Address ({activeNet})</p>
            <button onClick={() => setShowQr(v => !v)}
              className="flex items-center gap-1 text-xs text-[#1E3A8A] font-semibold">
              <QrCode size={14} /> {showQr ? "Hide QR" : "Show QR"}
            </button>
          </div>

          {showQr && (
            <div className="flex justify-center mb-3">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-block">
                {loadingAddr ? (
                  <div className="w-[150px] h-[150px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentAddress)}&size=150x150&margin=4`}
                    alt="QR Code"
                    className="w-[150px] h-[150px] rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          <div className="bg-[#EFF6FF] rounded-xl p-3 border border-[#BFDBFE] flex items-center gap-2">
            <p className="flex-1 text-xs text-slate-700 font-mono break-all">
              {loadingAddr && activeNet === "BEP20" ? "Loading address..." : currentAddress}
            </p>
            <button onClick={handleCopy} style={{ color: '#1E3A8A' }} className="shrink-0">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-red-500 mt-2">⚠️ Only send {activeNet} USDT to this address</p>
        </div>

        {/* Amount input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Confirm Deposit Amount</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (USDT)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-base" />
          {numAmount > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              You will receive: <strong>${numAmount.toFixed(2)} USDT</strong>
              {numAmount >= 50 && <span className="text-green-600 ml-2">+ {depositBonusPct}% bonus 🎁</span>}
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
            <li>Select <strong>BEP20 (BSC)</strong> network for fastest processing</li>
            <li>Enter exact amount and click Confirm</li>
            <li>Deposits ≥$50 earn {depositBonusPct}% bonus reward</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
