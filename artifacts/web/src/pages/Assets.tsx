import { useLocation } from "wouter";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE, useBalance } from "../App";

export default function Assets() {
  const [, setLocation] = useLocation();
  const { balance } = useBalance();

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Balance Card with Deposit/Withdraw */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Assets (USDT)</p>
        <h1 className="text-3xl font-bold mt-1 text-slate-800">${balance.toFixed(2)}</h1>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setLocation('/deposit')}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#1E3A8A' }}
          >
            <ArrowDownCircle size={18} /> Deposit
          </button>
          <button
            onClick={() => setLocation('/withdraw')}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowUpCircle size={18} /> Withdraw
          </button>
        </div>
      </div>

      {/* History Section */}
      <div className="mx-4" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#000', marginBottom: 12 }}>History</h3>
        <div style={{ height: 200 }} />
      </div>

      <BottomNav />
    </div>
  );
}
