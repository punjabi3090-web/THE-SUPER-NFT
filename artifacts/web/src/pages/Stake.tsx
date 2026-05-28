import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE } from "../App";

export default function Stake() {
  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-800 text-lg mb-2">Staking</h2>
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-slate-500 text-sm mb-4">No staking positions yet</p>
          <button
            onClick={() => console.log('start staking clicked')}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold px-8 py-2.5 rounded-full shadow-md"
          >
            Start Staking
          </button>
        </div>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3">Staking Plans</h3>
        {[
          { name: "Basic Plan", apy: "12% APY", min: "$50", duration: "30 days" },
          { name: "Pro Plan", apy: "18% APY", min: "$200", duration: "60 days" },
          { name: "Elite Plan", apy: "25% APY", min: "$500", duration: "90 days" },
        ].map(plan => (
          <div key={plan.name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div>
              <p className="font-semibold text-slate-800 text-sm">{plan.name}</p>
              <p className="text-xs text-slate-400">{plan.min} min · {plan.duration}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-600 font-bold text-sm">{plan.apy}</p>
              <button
                onClick={() => console.log('stake plan clicked', plan.name)}
                className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full mt-1 font-medium"
              >
                Stake
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
