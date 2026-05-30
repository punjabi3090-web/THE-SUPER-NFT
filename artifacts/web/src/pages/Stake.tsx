import { useState } from "react";
import { TrendingUp, CheckCircle, Clock } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE, useBalance } from "../App";

const plans = [
  {
    id: "7d",
    label: "7 Days",
    apy: 5,
    apyStr: "5%",
    days: 7,
    color: "from-emerald-400 to-teal-500",
    bgLight: "from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    tag: "Starter",
  },
  {
    id: "30d",
    label: "30 Days",
    apy: 12,
    apyStr: "12%",
    days: 30,
    color: "from-blue-400 to-indigo-500",
    bgLight: "from-blue-50 to-indigo-50",
    border: "border-blue-200",
    tag: "Popular",
  },
  {
    id: "90d",
    label: "90 Days",
    apy: 25,
    apyStr: "25%",
    days: 90,
    color: "from-purple-400 to-pink-500",
    bgLight: "from-purple-50 to-pink-50",
    border: "border-purple-200",
    tag: "Best Return",
  },
];

type PopupState = "success" | "insufficient" | "invalid" | null;

type Stake = { id: number; plan: string; amount: number; apy: string; dailyProfit: number; date: string; endDate: string };

function getStakes(): Stake[] { try { return JSON.parse(localStorage.getItem('userStakes') || '[]'); } catch { return []; } }
function saveStakes(s: Stake[]) { localStorage.setItem('userStakes', JSON.stringify(s)); }

export default function Stake() {
  const { balance, refresh } = useBalance();
  const [stakes, setStakes]         = useState<Stake[]>(() => getStakes());
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [amount, setAmount]             = useState("");
  const [popup, setPopup]               = useState<PopupState>(null);

  const numAmount   = parseFloat(amount || "0");
  const dailyProfit = numAmount > 0
    ? (numAmount * selectedPlan.apy) / 100 / selectedPlan.days
    : 0;
  const totalReturn = numAmount > 0
    ? numAmount + (numAmount * selectedPlan.apy) / 100
    : 0;

  const showPopup = (s: PopupState) => {
    setPopup(s);
    setTimeout(() => setPopup(null), 2500);
  };

  const handleStake = () => {
    if (!numAmount || numAmount < 10) { showPopup("invalid"); return; }
    if (numAmount > balance) { showPopup("insufficient"); return; }
    const endDate = new Date(Date.now() + selectedPlan.days * 86400000).toISOString();
    const newStake: Stake = { id: Date.now(), plan: selectedPlan.label, amount: numAmount, apy: selectedPlan.apyStr, dailyProfit, date: new Date().toISOString(), endDate };
    const updated = [...stakes, newStake];
    setStakes(updated); saveStakes(updated);
    refresh();
    showPopup("success"); setAmount("");
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">
          🧪 Test Mode
        </div>
      )}

      {popup === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm" style={{ background: '#1E3A8A' }}>
          ✅ Staked successfully! Notification sent.
        </div>
      )}
      {popup === "insufficient" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ❌ Insufficient balance!
        </div>
      )}
      {popup === "invalid" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ⚠️ Minimum stake is $10
        </div>
      )}

      {/* Balance strip */}
      <div className="mx-4 mt-4 bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
        <span className="text-sm text-slate-500">Available Balance</span>
        <span className="font-bold text-[#1E3A8A]">${balance.toFixed(2)}</span>
      </div>

      {/* Plan selector */}
      <div className="px-4 mt-4">
        <p className="text-sm font-semibold text-slate-600 mb-2">Select Plan</p>
        <div className="grid grid-cols-3 gap-3">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan); console.log("plan selected", plan.label); }}
              className={`rounded-2xl p-3 text-center border-2 transition-all ${
                selectedPlan.id === plan.id
                  ? `bg-gradient-to-br ${plan.color} text-white border-transparent shadow-md`
                  : `bg-gradient-to-br ${plan.bgLight} ${plan.border} text-slate-700`
              }`}
            >
              <p className="font-bold text-base">{plan.apy}%</p>
              <p className={`text-xs mt-0.5 ${selectedPlan.id === plan.id ? "text-white/80" : "text-slate-500"}`}>
                {plan.label}
              </p>
              <span className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
                selectedPlan.id === plan.id ? "bg-white/20 text-white" : "bg-white text-slate-500"
              }`}>
                {plan.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Stake Amount (USDT)</label>
        <div className="flex gap-2 mb-3">
          {[50, 100, 200, 500].map(q => (
            <button
              key={q}
              onClick={() => { setAmount(String(q)); console.log("quick stake amount", q); }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                amount === String(q)
                  ? `bg-gradient-to-r ${selectedPlan.color} text-white border-transparent`
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
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-slate-400 text-base"
        />
      </div>

      {/* Profit preview */}
      {numAmount >= 10 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#1E3A8A' }} /> Profit Preview
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-semibold text-slate-800">{selectedPlan.label} · {selectedPlan.apy}% APY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Profit</span>
              <span className="font-semibold text-[#1E3A8A]">+${dailyProfit.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">Total Return</span>
              <span className="font-bold text-[#1E3A8A]">${totalReturn.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stake button */}
      <div className="px-4 mt-4">
        <button
          onClick={handleStake}
          disabled={!numAmount || numAmount < 10 || numAmount > balance}
          className={`w-full font-bold py-3.5 rounded-2xl shadow-lg text-white disabled:opacity-40 bg-gradient-to-r ${selectedPlan.color}`}
        >
          Stake ${numAmount > 0 ? numAmount.toFixed(2) : "0.00"} → {selectedPlan.apy}% in {selectedPlan.label}
        </button>
      </div>

      {/* Active stakes */}
      {stakes.length > 0 && (
        <div className="px-4 mt-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Active Stakes ({stakes.length})</p>
          <div className="space-y-2">
            {stakes.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{s.plan}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> {new Date(s.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    Until: {new Date(s.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">${s.amount.toFixed(2)}</p>
                  <p className="text-xs text-[#1E3A8A] font-semibold flex items-center gap-0.5 justify-end mt-0.5">
                    <CheckCircle size={11} /> {s.apy} APY
                  </p>
                  <p className="text-xs text-slate-400">+${s.dailyProfit.toFixed(4)}/day</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon strip */}
      <div className="mx-4 mt-4 mb-4 rounded-2xl overflow-hidden" style={{ background: '#00c853', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>Coming Soon</p>
      </div>

      <BottomNav />
    </div>
  );
}
