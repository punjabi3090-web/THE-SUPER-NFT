import { useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE, useBalance } from "../App";

const nftItems = [
  {
    id: 1,
    name: "Super Ape #1234",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300",
    price: 50,
    timeLeft: "2d 14h",
    level: "R",
    yield: "5%",
  },
  {
    id: 2,
    name: "Meta Lion #567",
    img: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300",
    price: 120,
    timeLeft: "1d 6h",
    level: "SR",
    yield: "8%",
  },
  {
    id: 3,
    name: "Golden Eagle #321",
    img: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300",
    price: 200,
    timeLeft: "4h 30m",
    level: "UR",
    yield: "15%",
  },
];

type PopupState = { type: "success" | "insufficient" | null; name?: string };

export default function Reserve() {
  const { balance, addOrder } = useBalance();
  const [popup, setPopup]   = useState<PopupState>({ type: null });
  const [reserved, setReserved] = useState<number[]>([]);

  const showPopup = (state: PopupState) => {
    setPopup(state);
    setTimeout(() => setPopup({ type: null }), 2500);
  };

  const handleReserve = (nft: typeof nftItems[0]) => {
    console.log("reserve clicked", nft.name, nft.price);
    const ok = addOrder(nft.name, nft.price);
    if (!ok) {
      showPopup({ type: "insufficient" });
      return;
    }
    setReserved(prev => [...prev, nft.id]);
    showPopup({ type: "success", name: nft.name });
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">
          🧪 Test Mode
        </div>
      )}

      {popup.type === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ✅ Reserved: {popup.name}!
        </div>
      )}
      {popup.type === "insufficient" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm">
          ❌ Insufficient balance!
        </div>
      )}

      {/* Balance strip */}
      <div className="mx-4 mt-4 bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
        <span className="text-sm text-slate-500">Available Balance</span>
        <span className="font-bold text-emerald-600">${balance.toFixed(2)}</span>
      </div>

      {/* NFT List */}
      <div className="px-4 mt-4 space-y-4">
        {nftItems.map(nft => {
          const isReserved = reserved.includes(nft.id);
          return (
            <div key={nft.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative">
                <img src={nft.img} alt={nft.name} className="w-full h-44 object-cover" />
                <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {nft.level}
                </span>
                <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {nft.yield} yield
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  {nft.timeLeft} left
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{nft.name}</p>
                  <p className="text-emerald-600 font-bold text-lg mt-0.5">${nft.price}</p>
                </div>
                <button
                  onClick={() => handleReserve(nft)}
                  disabled={isReserved}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all ${
                    isReserved
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : balance < nft.price
                      ? "bg-red-50 text-red-400 border border-red-200"
                      : "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md active:scale-95"
                  }`}
                >
                  {isReserved ? (
                    <><CheckCircle size={16} /> Reserved</>
                  ) : balance < nft.price ? (
                    "Low Balance"
                  ) : (
                    "Reserve Now"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
