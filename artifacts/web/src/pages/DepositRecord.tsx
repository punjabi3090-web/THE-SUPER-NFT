import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getHistory, HistoryItem } from "../lib/history";
import { useState } from "react";

export default function DepositRecord() {
  const [, setLocation] = useLocation();
  const [records] = useState<HistoryItem[]>(() =>
    getHistory().filter(h => h.type === 'deposit')
  );

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-[#1E293B]">Deposit Records</h1>
        <span className="ml-auto text-xs text-slate-400 font-medium">{records.length} records</span>
      </div>

      <div className="px-4 mt-4">
        {records.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-semibold text-slate-500 mb-1">No deposit records found</p>
            <p className="text-sm">Your deposits will appear here after you make a deposit</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#34A853' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-[#1E293B] text-sm">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.amount !== undefined && (
                      <p className="font-bold text-[#34A853]">+${Number(item.amount).toFixed(2)}</p>
                    )}
                    {item.status && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'Pending'   ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'Completed' && <CheckCircle size={10} />}
                        {item.status === 'Pending'   && <Clock size={10} />}
                        {item.status === 'Failed'    && <XCircle size={10} />}
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
                {item.txHash && (
                  <div className="bg-slate-50 rounded-lg px-3 py-1.5 mt-1">
                    <p className="text-xs text-slate-400">TX: <span className="font-mono text-[#1E3A8A]">{String(item.txHash)}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
