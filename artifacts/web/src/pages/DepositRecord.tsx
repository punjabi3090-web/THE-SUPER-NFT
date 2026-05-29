import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";

export default function DepositRecord() {
  const [, setLocation] = useLocation();
  const { user } = useBalance();
  const records = (user?.myActivityHistory || []).filter(h => h.type === 'deposit');

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Deposit Records</h2>
        <span className="ml-auto text-xs text-slate-400">{records.length} records</span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">💰</p>
            <p className="text-slate-500 font-medium">No deposit records found</p>
            <p className="text-xs text-slate-400 mt-1">Your deposits will appear here</p>
            <button onClick={() => setLocation('/deposit')} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E3A8A' }}>
              Make First Deposit
            </button>
          </div>
        ) : records.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-emerald-400">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#EFF6FF' }}>💰</div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.title || 'Deposit'}</p>
                  <p className="text-xs text-slate-400">{r.date}</p>
                  {r.desc && <p className="text-xs text-slate-400">{r.desc}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">+${r.amount?.toFixed(2) ?? '0.00'}</p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  {r.status === 'Completed' ? (
                    <><CheckCircle size={11} className="text-emerald-500" /><span className="text-[10px] text-emerald-500">Completed</span></>
                  ) : (
                    <><Clock size={11} className="text-orange-400" /><span className="text-[10px] text-orange-400">Pending</span></>
                  )}
                </div>
              </div>
            </div>
            {r.txHash && (
              <div className="mt-2 bg-slate-50 rounded-lg px-3 py-1.5">
                <p className="text-[10px] text-slate-400 font-mono truncate">TX: {r.txHash}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
