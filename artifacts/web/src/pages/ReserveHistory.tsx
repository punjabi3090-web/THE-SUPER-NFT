import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getHistory, HistoryItem } from "../lib/history";
import { useState } from "react";

export default function ReserveHistory() {
  const [, setLocation] = useLocation();
  const [records] = useState<HistoryItem[]>(() =>
    getHistory().filter(h => h.type === 'reserve' || h.type === 'sell')
  );

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-[#1E293B]">Reserve History</h1>
        <span className="ml-auto text-xs text-slate-400">{records.length} records</span>
      </div>

      <div className="px-4 mt-4">
        {records.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-5xl mb-4">🖼️</p>
            <p className="font-semibold text-slate-500 mb-1">No reserve records found</p>
            <p className="text-sm">NFT reserve and sell activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
                style={{ borderColor: item.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ background: `${item.color}20` }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1E293B] text-sm">{item.title}</p>
                      {!!item.nftLevel && <p className="text-xs text-slate-400">Level {String(item.nftLevel)} NFT</p>}
                      <p className="text-xs text-slate-300">{item.date}</p>
                    </div>
                  </div>
                  {item.amount !== undefined && (
                    <p className="font-bold" style={{ color: item.color }}>
                      {item.type === 'sell' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                    </p>
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
