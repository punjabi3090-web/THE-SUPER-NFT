import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowDownCircle, ArrowUpCircle, Lock, Tag } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { getMyOrders, sellNft, type NftOrder } from "../lib/api";

const LOCKED_CARDS = [
  { name: "Bronze NFT",   tier: "Bronze",   price: 100,  emoji: "🥉", from: "#92400e", to: "#78350f", badge: "bg-amber-700" },
  { name: "Silver NFT",   tier: "Silver",   price: 250,  emoji: "🥈", from: "#475569", to: "#334155", badge: "bg-slate-500" },
  { name: "Gold NFT",     tier: "Gold",     price: 500,  emoji: "🥇", from: "#b45309", to: "#92400e", badge: "bg-yellow-600" },
  { name: "Diamond NFT",  tier: "Diamond",  price: 1000, emoji: "💎", from: "#0e7490", to: "#1e3a8a", badge: "bg-cyan-700"   },
  { name: "Platinum NFT", tier: "Platinum", price: 2500, emoji: "⭐", from: "#7e22ce", to: "#6d28d9", badge: "bg-purple-700" },
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

      {/* NFT Cards — 5 Locked (Coming Soon) */}
      <div className="mx-4 mt-5">
        <h3 className="font-bold text-slate-800 text-base mb-1">NFT Marketplace</h3>
        <p className="text-xs text-slate-400 mb-3">Exclusive NFTs — Launching Soon</p>
        <div className="grid grid-cols-1 gap-3">
          {LOCKED_CARDS.map(card => (
            <button
              key={card.name}
              onClick={() => showMsg("🔒 Coming Soon! This NFT tier will be available shortly.", false)}
              className="w-full text-left rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative flex items-center gap-4 p-4"
              style={{ background: `linear-gradient(135deg, ${card.from}22, ${card.to}11)`, borderColor: `${card.from}44` }}
            >
              {/* Emoji icon */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}>
                {card.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800 text-sm">{card.name}</p>
                  <span className={`text-[10px] text-white font-bold px-2 py-0.5 rounded-full ${card.badge}`}>
                    {card.tier}
                  </span>
                </div>
                <p className="text-base font-bold" style={{ color: card.from }}>${card.price.toLocaleString()} USDT</p>
                <p className="text-xs text-slate-400 mt-0.5">Exclusive NFT · High Yield Returns</p>
              </div>

              {/* Lock badge */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">Soon</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* My Collection */}
      <div className="mx-4 mt-5">
        <h3 className="font-bold text-slate-800 text-base mb-3">
          My Collection {collection.length > 0 && <span className="text-xs font-normal text-slate-400">({collection.length} NFTs)</span>}
        </h3>
        {collection.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm text-slate-400">No NFTs yet. Reserve one from the Reserve page!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {collection.map(order => (
              <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <img src={order.nftImage} alt={order.nftName} className="w-full aspect-square object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/150x150/1a1a2a/fff?text=NFT`; }} />
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-700 leading-tight truncate">{order.nftName}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5">${order.nftPrice}</p>
                  <button onClick={() => handleSell(order)} disabled={!!loading}
                    className="w-full mt-1.5 py-1 rounded-lg text-white text-[10px] font-bold disabled:opacity-50 flex items-center justify-center gap-0.5 bg-emerald-500">
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
