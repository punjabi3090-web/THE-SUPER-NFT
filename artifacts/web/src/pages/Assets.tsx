import { useLocation } from "wouter";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testNFTs, testUser, TEST_MODE } from "../App";

export default function Assets() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Balance Card with Deposit/Withdraw */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Assets (USDT)</p>
        <h1 className="text-3xl font-bold mt-1 text-slate-800">${testUser.balance.toFixed(2)}</h1>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { console.log('deposit clicked'); setLocation('/deposit'); }}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowDownCircle size={18} /> Deposit
          </button>
          <button
            onClick={() => { console.log('withdraw clicked'); setLocation('/withdraw'); }}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowUpCircle size={18} /> Withdraw
          </button>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="mx-4 mt-4">
        <h3 className="font-semibold text-slate-800 mb-3">My NFTs</h3>
        <div className="grid grid-cols-2 gap-3">
          {testNFTs.map(nft => (
            <div key={nft.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <img src={nft.img} alt={nft.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-800 truncate">{nft.name}</p>
                <p className="text-emerald-600 font-bold text-sm mt-0.5">${nft.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
