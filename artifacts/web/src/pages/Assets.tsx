import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testNFTs, testUser, TEST_MODE } from "../App";

export default function Assets() {
  return (
    <div className="pb-28 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Balance */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white shadow-md" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}>
        <p className="text-sm opacity-80 mb-1">Total Balance</p>
        <h2 className="text-3xl font-bold">${testUser.balance.toFixed(2)}</h2>
        <p className="text-xs opacity-70 mt-1">USDT</p>
      </div>

      {/* NFT Grid */}
      <div className="mx-4 mt-4">
        <h3 className="font-semibold text-slate-800 mb-3">My NFTs</h3>
        {testNFTs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-2">🖼️</p>
            <p className="text-slate-400 text-sm">No NFTs yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {testNFTs.map(nft => (
              <div key={nft.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <img src={nft.img} alt={nft.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-800 truncate">{nft.name}</p>
                  <p className="text-blue-600 font-bold text-sm mt-0.5">${nft.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
