import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

export default function ReserveHistory() {
  const [, setLocation] = useLocation();
  const { user } = useBalance();
  const records = (user?.myActivityHistory || []).filter(h => h.type === 'reserve' || h.type === 'sell');

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Reserve History</h2>
        <span className="ml-auto text-xs text-slate-400">{records.length} records</span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🖼️</p>
            <p className="text-slate-500 font-medium">No NFT reserve history</p>
            <p className="text-xs text-slate-400 mt-1">Your NFT activity will appear here</p>
            <button onClick={() => setLocation('/reserve')} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E3A8A' }}>
              Explore NFTs
            </button>
          </div>
        ) : records.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${item.type === 'reserve' ? 'border-blue-400' : 'border-emerald-400'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#EFF6FF' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">{item.title || item.type}</p>
                  {!!item.nftLevel && <p className="text-xs text-slate-400">Level {String(item.nftLevel)} NFT</p>}
                  <p className="text-xs text-slate-300">{item.date}</p>
                </div>
              </div>
              {item.amount !== undefined && (
                <div className="text-right">
                  <p className={`font-bold text-sm ${item.type === 'sell' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {item.type === 'sell' ? '+' : '-'}${item.amount.toFixed(2)}
                  </p>
                  {item.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{item.status}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
