import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE, useBalance } from "../App";

type TabKey = "today" | "reserve" | "collection";

type UserNFT = { id: number; level: number; buyPrice: number; buyDate: string };

function initDemoData() {
  if (!localStorage.getItem('userLevel'))    localStorage.setItem('userLevel', '2');
  if (!localStorage.getItem('walletBalance')) localStorage.setItem('walletBalance', '111.50');
  if (!localStorage.getItem('nftOrders'))
    localStorage.setItem('nftOrders', JSON.stringify({ bought: 3, sold: 1, total: 4 }));
  if (!localStorage.getItem('userNFTs'))
    localStorage.setItem('userNFTs', JSON.stringify([
      { id: 1, level: 2, buyPrice: 100, buyDate: '2026-05-27' },
      { id: 2, level: 2, buyPrice: 100, buyDate: '2026-05-26' },
    ]));
}

const STATS = (balance: number) => [
  { label: "Today Earnings",          value: "0",                   border: "#4285F4" },
  { label: "Cumulative Income",       value: "0",                   border: "#1E3A8A" },
  { label: "Team Benefits",           value: "0",                   border: "#9AA0A6" },
  { label: "Reservation range",       value: "1 ~ 1,000",           border: "#FBBC04" },
  { label: "Wallet Balance",          value: `$${balance.toFixed(2)}`, border: "#00BCD4" },
  { label: "Balance for Reservation", value: `$${balance.toFixed(2)}`, border: "#202124" },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "today",      label: "Today's"   },
  { key: "reserve",    label: "Reserve"   },
  { key: "collection", label: "Collection" },
];

export default function Reserve() {
  const { balance } = useBalance();
  const [tab, setTab]         = useState<TabKey>("today");
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);

  useEffect(() => {
    initDemoData();
    setUserNFTs(JSON.parse(localStorage.getItem('userNFTs') || '[]'));
  }, []);

  return (
    <div className="pb-20 max-w-md mx-auto bg-gray-50 min-h-screen">
      <Header />
      {TEST_MODE && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">
          🧪 Test Mode
        </div>
      )}

      {/* ── 6 Stats Cards — 2×3 grid ─────────────────────────────────── */}
      <div className="px-4 mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {STATS(balance).map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${stat.border}`,
            }}
          >
            <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', lineHeight: 1.1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f1f1' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? '#1E3A8A' : '#666',
                borderBottom: tab === t.key ? '2px solid #1E3A8A' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'collection' && userNFTs.length > 0 ? (
          <div className="p-4 space-y-3">
            {userNFTs.map(nft => (
              <div key={nft.id} className="flex items-center justify-between bg-[#EFF6FF] rounded-xl p-4 border border-[#BFDBFE]">
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">NFT #{nft.id} · Level {nft.level}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bought: {new Date(nft.buyDate).toLocaleDateString()}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#1E3A8A' }}>
                    ROI: 12% APY
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1E293B]">${nft.buyPrice}</p>
                  <button
                    className="mt-2 px-4 py-1.5 rounded-lg text-white text-xs font-bold"
                    style={{ background: '#1E3A8A' }}
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: 200 }} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
