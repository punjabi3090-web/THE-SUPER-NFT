import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { addToUserHistory, getCurrentUserId } from "../lib/api";

type TabKey = "today" | "reserve" | "collection";
type UserNFT = { id: number; level: number; buyPrice: number; buyDate: string };
type ReserveOrder = { id: number; type: string; status: string; date: string };

const TABS: { key: TabKey; label: string }[] = [
  { key: "today",      label: "Today's"   },
  { key: "reserve",    label: "Reserve"   },
  { key: "collection", label: "Collection" },
];

function getOrders(): ReserveOrder[] {
  try { return JSON.parse(localStorage.getItem('userOrders') || '[]'); } catch { return []; }
}
function saveOrders(o: ReserveOrder[]) { localStorage.setItem('userOrders', JSON.stringify(o)); }

export default function Reserve() {
  const { balance, refresh } = useBalance();
  const [tab, setTab]     = useState<TabKey>("today");
  const [orders, setOrders] = useState<ReserveOrder[]>(() => getOrders());
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>(() =>
    JSON.parse(localStorage.getItem('userNFTs') || '[]')
  );
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const reserveOrders = orders.filter(o => o.type === 'reserve');
  const totalReserve  = reserveOrders.length;
  const activeCount   = reserveOrders.filter(o => o.status === 'active').length;
  const completedCount = reserveOrders.filter(o => o.status === 'completed').length;

  const stats = [
    { label: "Total Reserve",          value: String(totalReserve),         border: "#4285F4" },
    { label: "Active",                  value: String(activeCount),          border: "#1E3A8A" },
    { label: "Completed",               value: String(completedCount),       border: "#34A853" },
    { label: "Reservation Range",       value: "1 ~ 1,000",                  border: "#FBBC04" },
    { label: "Wallet Balance",          value: `$${balance.toFixed(2)}`,     border: "#00BCD4" },
    { label: "Balance for Reservation", value: `$${balance.toFixed(2)}`,     border: "#202124" },
  ];

  const handleReserveNow = () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastReserveDate');
    if (lastDate === today) {
      showToast("You have already reserved today. Come back tomorrow!", false);
      return;
    }
    const newOrder: ReserveOrder = {
      id: Date.now(),
      type: 'reserve',
      status: 'active',
      date: new Date().toISOString(),
    };
    const updated = [...orders, newOrder];
    setOrders(updated);
    saveOrders(updated);
    localStorage.setItem('lastReserveDate', today);

    const uid = getCurrentUserId();
    if (uid) {
      addToUserHistory(uid, {
        type: 'reserve',
        title: 'Daily Reservation',
        amount: 0,
        status: 'active',
        date: new Date().toLocaleString(),
        icon: '📌',
        color: '#1E3A8A',
      });
    }

    showToast("Reservation Successful! ✅");
  };

  const handleSell = (nft: UserNFT) => {
    const uid = getCurrentUserId();
    if (uid) {
      addToUserHistory(uid, {
        type: 'sell',
        title: `NFT #${nft.id} Sold`,
        amount: nft.buyPrice,
        nftLevel: nft.level,
        status: 'Completed',
        date: new Date().toLocaleString(),
        icon: '🖼️',
        color: '#34A853',
      });
    }
    const updated = userNFTs.filter(n => n.id !== nft.id);
    setUserNFTs(updated);
    localStorage.setItem('userNFTs', JSON.stringify(updated));
    refresh();
  };

  const todayStr = new Date().toDateString();
  const alreadyReservedToday = localStorage.getItem('lastReserveDate') === todayStr;

  return (
    <div className="pb-20 max-w-md mx-auto bg-gray-50 min-h-screen">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.text}
        </div>
      )}

      {/* Stats grid */}
      <div className="px-4 mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${stat.border}` }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', lineHeight: 1.1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Dark blue Reserve Now strip */}
      <div style={{ background: '#0a1172', padding: '15px', textAlign: 'center', margin: '15px 16px 0', borderRadius: 12 }}>
        <button
          onClick={handleReserveNow}
          disabled={alreadyReservedToday}
          style={{
            background: alreadyReservedToday ? '#555' : '#1a237e',
            color: 'white',
            padding: '12px 40px',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: alreadyReservedToday ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            opacity: alreadyReservedToday ? 0.7 : 1,
          }}
        >
          {alreadyReservedToday ? '✅ Reserved Today' : 'Reserve Now'}
        </button>
        {alreadyReservedToday && (
          <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>Next reservation available tomorrow</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f1f1' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '12px 0', fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#1E3A8A' : '#666',
              borderBottom: tab === t.key ? '2px solid #1E3A8A' : '2px solid transparent',
              background: 'none', cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'reserve' && reserveOrders.length > 0 ? (
          <div className="p-4 space-y-3">
            {[...reserveOrders].reverse().map(o => (
              <div key={o.id} className="flex items-center justify-between bg-[#EFF6FF] rounded-xl p-4 border border-[#BFDBFE]">
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">Daily Reservation</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(o.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${o.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  {o.status === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>
            ))}
          </div>
        ) : tab === 'collection' && userNFTs.length > 0 ? (
          <div className="p-4 space-y-3">
            {userNFTs.map(nft => (
              <div key={nft.id} className="flex items-center justify-between bg-[#EFF6FF] rounded-xl p-4 border border-[#BFDBFE]">
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">NFT #{nft.id} · Level {nft.level}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bought: {new Date(nft.buyDate).toLocaleDateString()}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#1E3A8A' }}>ROI: 12% APY</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1E293B]">${nft.buyPrice}</p>
                  <button className="mt-2 px-4 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: '#1E3A8A' }} onClick={() => handleSell(nft)}>
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#aaa', fontSize: 13 }}>
              {tab === 'today' ? 'No activity today' : tab === 'reserve' ? 'No reservations yet' : 'No NFTs in collection'}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
