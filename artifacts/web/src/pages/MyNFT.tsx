import { useState } from "react";
import BottomNav from "../components/BottomNav";
import { testNFTs, TEST_MODE } from "../App";

export default function MyNFT() {
  const [activeTab, setActiveTab] = useState("Holding");
  const [popup, setPopup] = useState("");
  const tabs = ["Holding", "OnSale", "Sold"];

  const holdingNFTs = [testNFTs[0], testNFTs[1]];

  const handleSell = (nft: typeof testNFTs[0]) => {
    console.log('sell clicked', nft);
    setPopup(`${nft.name} listed for sale!`);
    setTimeout(() => setPopup(""), 2500);
  };

  return (
    <div className="min-h-screen pb-20" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ {popup}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-slate-800">My NFTs</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {activeTab === "Holding" && holdingNFTs.map(nft => (
          <div key={nft.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3 p-3">
            <img src={nft.img} alt={nft.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{nft.name}</p>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{nft.level}</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-1">Daily: <span className="text-emerald-600 font-bold">${nft.daily}</span></p>
              <p className="text-slate-500 text-xs">Profit: <span className="text-emerald-600 font-bold">{nft.profit}</span></p>
              <button
                onClick={() => handleSell(nft)}
                className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-1.5 rounded-lg"
              >
                Sell
              </button>
            </div>
          </div>
        ))}

        {activeTab === "OnSale" && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-sm">No NFTs on sale</p>
          </div>
        )}

        {activeTab === "Sold" && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">No sold NFTs</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
