import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowDownCircle, ArrowUpCircle, Tag } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { getMyOrders, sellNft, type NftOrder } from "../lib/api";


const NFT_CARDS = [
  { name: "Super Pixel Art", price: 100, image: "/images/nft-card-1.png" },
  { name: "Crystal Genesis", price: 200, image: "/images/nft-card-2.png" },
  { name: "Digital Dream",   price: 300, image: "/images/nft-card-3.png" },
  { name: "Neon Warriors",   price: 400, image: "/images/nft-card-4.png" },
  { name: "Cosmic Vision",   price: 500, image: "https://placehold.co/150x150/1a1a2a/7C3AED?text=NFT+5" },
  { name: "Golden Epoch",    price: 600, image: "https://placehold.co/150x150/1a1a2a/FFD700?text=NFT+6" },
];

export default function Assets() {
  const [, setLocation] = useLocation();
  const { balance, user, refresh: refreshBalance } = useBalance();
  const [orders, setOrders] = useState<NftOrder[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const uid = user?.userId;

  const loadOrders = () => {
    if (!uid) return;
    getMyOrders(uid).then(setOrders).catch(() => {});
  };

  useEffect(() => { loadOrders(); }, [uid]);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  };

  const handleSell = async (order: NftOrder) => {
    if (!uid) return;
    setLoading(`sell_${order.id}`);
    try {
      await sellNft(uid, order.id);
      showMsg(`Sold! +$${order.nftPrice} added to balance.`);
      refreshBalance();
      loadOrders();
    } catch { showMsg("Failed to sell NFT", false); }
    finally { setLoading(null); }
  };

  const collection = orders.filter(o => o.status === 'bought');

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />

      {/* Toast */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${msg.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {msg.text}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Assets (USDT)</p>
        <h1 className="text-3xl font-bold mt-1 text-slate-800">${balance.toFixed(2)}</h1>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setLocation('/deposit')}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: '#1E3A8A' }}>
            <ArrowDownCircle size={18} /> Deposit
          </button>
          <button onClick={() => setLocation('/withdraw')}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
            <ArrowUpCircle size={18} /> Withdraw
          </button>
        </div>
      </div>

      {/* NFT Marketplace — 3x2 Grid (display only) */}
      <div className="mx-4 mt-5">
        <h3 className="font-bold text-slate-800 text-base mb-1">NFT Marketplace</h3>
        <p className="text-xs text-slate-400 mb-3">Use the <strong>Reserve page</strong> to make your daily reservation.</p>
        <div className="grid grid-cols-3 gap-3">
          {NFT_CARDS.map(card => (
            <div key={card.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative" style={{ opacity: 0.75, pointerEvents: 'none' }}>
              <img src={card.image} alt={card.name} className="w-full aspect-square object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/150x150/1a1a2a/fff?text=NFT`; }} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="text-[9px] font-bold text-white bg-[#1E3A8A]/80 px-2 py-1 rounded-lg text-center leading-tight">Reserve from Reserve Page</span>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-semibold text-slate-700 leading-tight truncate">{card.name}</p>
                <p className="text-[10px] font-bold text-[#1E3A8A] mt-0.5">${card.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection */}
      <div className="mx-4 mt-5">
        <h3 className="font-bold text-slate-800 text-base mb-3">
          My Collection {collection.length > 0 && <span className="text-xs font-normal text-slate-400">({collection.length} NFTs)</span>}
        </h3>
        {collection.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm text-slate-400">No NFTs yet. Reserve one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {collection.map(order => (
              <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <img src={order.nftImage} alt={order.nftName} className="w-full aspect-square object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/150x150/1a1a2a/fff?text=NFT`; }} />
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-700 leading-tight truncate">{order.nftName}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5">${order.nftPrice}</p>
                  <button
                    onClick={() => handleSell(order)}
                    disabled={!!loading}
                    className="w-full mt-1.5 py-1 rounded-lg text-white text-[10px] font-bold disabled:opacity-50 flex items-center justify-center gap-0.5 bg-emerald-500"
                  >
                    <Tag size={10} />
                    {loading === `sell_${order.id}` ? '...' : 'Sell'}
                  </button>
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
