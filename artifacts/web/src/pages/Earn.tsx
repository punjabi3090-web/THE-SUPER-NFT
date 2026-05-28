import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE } from "../App";

export default function Earn() {
  return (
    <div className="pb-28 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">💰</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Earn Page</h2>
        <p className="text-slate-400 text-sm">Coming Soon — Stay tuned for earning opportunities</p>
      </div>
      <BottomNav />
    </div>
  );
}
