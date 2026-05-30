import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { getPlatformSettings } from "../lib/api";

const quickAmounts = [10, 50, 100, 500];

function parseTime(t: string): { h: number; m: number } {
  const [hStr, mStr] = t.split(":");
  return { h: parseInt(hStr ?? "0", 10), m: parseInt(mStr ?? "0", 10) };
}

function isWithinWindow(openTime: string, closeTime: string, allowedDays: string): boolean {
  const now = new Date();
  const day = now.getDay();
  const days = allowedDays.split(",").map(d => parseInt(d.trim(), 10));
  if (days.length > 0 && !days.includes(day)) return false;
  const { h: oh, m: om } = parseTime(openTime);
  const { h: ch, m: cm } = parseTime(closeTime);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  return nowMins >= openMins && nowMins < closeMins;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { balance, requestWithdraw, refresh, user } = useBalance();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup]   = useState<string | null>(null);

  const [wdOpen, setWdOpen]   = useState("00:00");
  const [wdClose, setWdClose] = useState("23:59");
  const [wdDays, setWdDays]   = useState("0,1,2,3,4,5,6");
  const [timingLoaded, setTimingLoaded] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(s => {
      if (s.withdraw_open_time)  setWdOpen(s.withdraw_open_time);
      if (s.withdraw_close_time) setWdClose(s.withdraw_close_time);
      if (s.withdraw_days)       setWdDays(s.withdraw_days);
    }).catch(() => {}).finally(() => setTimingLoaded(true));
  }, []);

  const numAmount = parseFloat(amount) || 0;

  const showPopup = (msg: string) => {
    setPopup(msg);
    setTimeout(() => setPopup(null), 3500);
  };

  const allowed = timingLoaded ? isWithinWindow(wdOpen, wdClose, wdDays) : true;

  const allowedDayNames = wdDays.split(",").map(d => DAY_NAMES[parseInt(d.trim(), 10)] ?? "").filter(Boolean).join(", ");

  const handleSubmit = async () => {
    if (!numAmount || numAmount <= 0) { showPopup("❌ Please enter amount"); return; }
    if (!allowed) { showPopup(`⚠️ Withdrawals are only available ${allowedDayNames} from ${wdOpen} to ${wdClose}`); return; }
    setLoading(true);
    try {
      const result = await requestWithdraw(numAmount);
      refresh();
      if (result === 'disabled')          showPopup("⚠️ Withdrawals are currently disabled");
      else if (result === 'no_auth')      showPopup("⚠️ Please bind Google Authenticator first");
      else if (result === 'no_address')   showPopup("⚠️ Please bind your withdrawal address first");
      else if (result === 'delay')        showPopup("⚠️ Address was just bound — wait 24 hours before withdrawing");
      else if (result === 'time_restricted') showPopup(`⚠️ Withdrawals are only open ${allowedDayNames} from ${wdOpen}–${wdClose}`);
      else if (result === 'min')          showPopup("⚠️ Minimum withdrawal is $10 USDT");
      else if (result === 'max')          showPopup("⚠️ Maximum withdrawal limit exceeded");
      else if (result === 'insufficient') showPopup("❌ Insufficient balance");
      else { showPopup("✅ Withdrawal submitted! Pending admin approval."); setAmount(""); }
    } catch {
      showPopup("❌ Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const wdAddress = user?.withdrawalAddress;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-sm text-white max-w-xs text-center"
          style={{ background: popup.startsWith('✅') ? '#1E3A8A' : '#EA4335' }}>
          {popup}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/assets')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Withdraw USDT</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-[#1E293B]">${balance.toFixed(2)} USDT</p>
        </div>

        {/* Withdraw timing info */}
        {timingLoaded && (
          <div className={`rounded-2xl p-3 flex items-start gap-2 border ${allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
            <Clock size={15} className={`mt-0.5 shrink-0 ${allowed ? 'text-emerald-600' : 'text-orange-500'}`} />
            <div>
              <p className={`text-xs font-semibold ${allowed ? 'text-emerald-700' : 'text-orange-700'}`}>
                {allowed ? '✅ Withdrawals are open now' : '⏰ Withdrawals currently closed'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hours: {wdOpen} – {wdClose} · Days: {allowedDayNames || "All days"}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-2">Withdrawal Address (TRC20)</p>
          {wdAddress ? (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-600 font-mono break-all">{wdAddress}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700">No address bound</p>
                <button onClick={() => setLocation('/security')} className="text-xs text-blue-600 underline mt-0.5">
                  Bind in Security →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs text-slate-500 font-semibold">Amount (USDT)</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (min $10)"
            className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-lg font-bold" />
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="py-2 rounded-xl text-sm font-semibold border border-[#BFDBFE] text-[#1E3A8A] hover:bg-[#EFF6FF]">
                ${a}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit}
            disabled={!numAmount || numAmount <= 0 || !wdAddress || loading || !allowed}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg disabled:opacity-50 transition-all"
            style={{ background: '#1E3A8A' }}>
            {loading ? "Submitting..." : !allowed ? "Outside Withdrawal Hours" : "Withdraw USDT"}
          </button>
          <p className="text-xs text-slate-400 text-center">Min: $10 USDT · Processed within 24h</p>
        </div>
      </div>
    </div>
  );
}
