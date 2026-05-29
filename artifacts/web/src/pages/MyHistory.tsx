import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import type { HistoryItem } from "../lib/store";

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

const INCOME_TYPES = new Set(['deposit', 'reward', 'commission', 'admin']);

export default function MyHistory() {
  const [, setLocation] = useLocation();
  const { user } = useBalance();
  const [filter, setFilter] = useState<FilterKey>('all');

  const allHistory: HistoryItem[] = user?.myActivityHistory || [];
  const filtered = filter === 'all' ? allHistory : allHistory.filter(h => h.type === filter);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">My History</h2>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-slate-100">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f.key ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
            style={filter === f.key ? { background: '#1E3A8A' } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-slate-500 font-medium">No records found</p>
            <p className="text-xs text-slate-400 mt-1">Activity will appear here as you use the app</p>
          </div>
        ) : filtered.map(item => {
          const isIncome = INCOME_TYPES.has(item.type);
          return (
            <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `${item.color}18` }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1E293B] text-sm truncate">{item.title || item.type}</p>
                {!!(item.desc || item.rewardType || item.from) && (
                  <p className="text-xs text-slate-400 truncate">
                    {String(item.desc ?? item.rewardType ?? (item.from ? `From: ${item.from}` : ''))}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-0.5">{item.date}</p>
              </div>
              <div className="text-right shrink-0">
                {item.amount !== undefined && (
                  <p className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
                  </p>
                )}
                {item.status && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'Rejected'  ? 'bg-red-100 text-red-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>{item.status}</span>
                )}
                {item.txHash && item.txHash !== 'Pending approval' && (
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5 truncate max-w-[80px]">{item.txHash.slice(0,10)}...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
