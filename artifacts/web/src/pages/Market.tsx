import { useState } from "react";
import { Search } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { testNFTs, TEST_MODE } from "../App";

export default function Market() {
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [popup, setPopup] = useState("");
  const tabs = ["All", "R", "SR", "SSR", "UR"];

  const filtered = testNFTs.filter(nft => {
    const matchTab = activeTab === "All" || nft.level === activeTab;
    const matchSearch = nft.name.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleBuy = (nft: typeof testNFTs[0]) => {
    console.log('buy clicked', nft);
    setPopup(`Purchased ${nft.name}!`);
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
        <h1 className="text-xl font-bold text-slate-800 mb-3">Market</h1>
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-100">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search NFTs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-slate-700 bg-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map(nft => (
          <div key={nft.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative">
              <img src={nft.img} alt={nft.name} className="w-full h-32 object-cover" />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-bold">{nft.level}</span>
              <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{nft.profit}</span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-800 truncate mb-1">{nft.name}</p>
              <p className="text-emerald-600 font-bold text-base mb-2">${nft.price}</p>
              <button
                onClick={() => handleBuy(nft)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2 rounded-xl"
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
