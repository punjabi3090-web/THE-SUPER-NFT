import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getHistory, HistoryItem } from "../lib/history";

type FilterKey = 'all' | 'deposit' | 'withdrawal' | 'reward' | 'trading' | 'security' | 'commission';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All'        },
  { key: 'deposit',    label: 'Deposits'   },
  { key: 'withdrawal', label: 'Withdrawals'},
  { key: 'reward',     label: 'Rewards'    },
  { key: 'trading',    label: 'Trading'    },
  { key: 'security',   label: 'Security'   },
  { key: 'commission', label: 'Commission' },
];

const TRADING_TYPES = new Set(['reserve', 'sell', 'trading']);

function matchFilter(item: HistoryItem, filter: FilterKey): boolean {
  if (filter === 'all')        return true;
  if (filter === 'trading')    return TRADING_TYPES.has(item.type);
  return item.type === filter;
}

export default function MyHistory() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterKey>('all');
  const all = getHistory();
  const filtered = all.filter(h => matchFilter(h, filter));

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-[#1E293B]">My History</h1>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
      </div>

      {/* Filter tabs — scrollable */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-10">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: filter === f.key ? '#1E3A8A' : '#F1F5F9',
                color:      filter === f.key ? '#FFFFFF' : '#64748B',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-3">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-semibold text-slate-500 mb-1">No records found</p>
            <p className="text-sm">Activity will appear here as you use the platform</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                {/* Icon circle */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${item.color}18` }}
                >
                  {item.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1E293B] text-sm truncate">{item.title}</p>
                  {!!(item.desc || item.rewardType || item.commissionType || item.nftLevel) && (
                    <p className="text-xs text-slate-400 truncate">
                      {String(item.desc ?? item.rewardType ?? item.commissionType ?? `NFT Level ${item.nftLevel}`)}
                    </p>
                  )}
                  <p className="text-xs text-slate-300 mt-0.5">{item.date}</p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  {item.amount !== undefined && (
                    <p className="font-bold text-sm" style={{ color: item.color }}>
                      {item.type === 'withdrawal' || item.type === 'sell' ? '-' : '+'}${Number(item.amount).toFixed(2)}
                    </p>
                  )}
                  {item.status && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{String(item.status)}</span>
                  )}
                  {item.txHash && (
                    <span className="text-[10px] font-mono text-slate-300 block truncate max-w-[80px]">{String(item.txHash).slice(0,10)}..</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
