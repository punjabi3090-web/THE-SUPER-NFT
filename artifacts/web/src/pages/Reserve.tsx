import { useState } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { TEST_MODE, useBalance } from "../App";

type TabKey = "today" | "reserve" | "collection";

const STATS = (balance: number) => [
  { label: "Today Earnings",        value: "0",          border: "#4285F4" },
  { label: "Cumulative Income",     value: "0",          border: "#34A853" },
  { label: "Team Benefits",         value: "0",          border: "#9AA0A6" },
  { label: "Reservation range",     value: "1 ~ 1,000",  border: "#FBBC04" },
  { label: "Wallet Balance",        value: `$${balance.toFixed(2)}`, border: "#00BCD4" },
  { label: "Balance for Reservation", value: `$${balance.toFixed(2)}`, border: "#202124" },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "today",      label: "Today's"   },
  { key: "reserve",    label: "Reserve"   },
  { key: "collection", label: "Collection"},
];

export default function Reserve() {
  const { balance } = useBalance();
  const [tab, setTab] = useState<TabKey>("today");

  return (
    <div className="pb-20 max-w-md mx-auto bg-gray-50 min-h-screen">
      <Header />
      {TEST_MODE && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">
          🧪 Test Mode
        </div>
      )}

      {/* ── 6 Stats Cards — 2x3 grid ─────────────────────────────────── */}
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
            <p style={{ fontSize: 24, fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{stat.value}</p>
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
                color: tab === t.key ? '#1a73e8' : '#666',
                borderBottom: tab === t.key ? '2px solid #1a73e8' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — completely empty */}
        <div style={{ height: 200 }} />
      </div>

      <BottomNav />
    </div>
  );
}
