import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Check, Clock, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AnnouncementBanner from "../components/AnnouncementBanner";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Network = "BEP20" | "TRC20";

type WdSettings = {
  min_withdraw:         number;
  max_withdraw:         number;
  withdraw_fee_percent: number;
  withdraw_start_time:  string;
  withdraw_end_time:    string;
  withdrawal_min_hours: number;
  withdrawal_max_hours: number;
};

const DEFAULT_WD: WdSettings = {
  min_withdraw:         10,
  max_withdraw:         10000,
  withdraw_fee_percent: 2,
  withdraw_start_time:  "00:00",
  withdraw_end_time:    "23:59",
  withdrawal_min_hours: 24,
  withdrawal_max_hours: 72,
};

function isWithinWindow(start: string, end: string): boolean {
  if (!start || !end || start === "00:00" && end === "23:59") return true;
  const now  = new Date();
  const pad  = (n: number) => String(n).padStart(2, "0");
  const cur  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return cur >= start && cur <= end;
}

export default function Withdraw() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [balance,    setBalance]    = useState(0);
  const [balLoading, setBalLoading] = useState(true);
  const [wdSettings, setWdSettings] = useState<WdSettings>(DEFAULT_WD);
  const [network,    setNetwork]    = useState<Network>("TRC20");
  const [amount,     setAmount]     = useState("");
  const [wallet,     setWallet]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profileData }, { data: settingsRows }] = await Promise.all([
        supabase.from("profiles").select("balance").eq("user_id", user.id).single(),
        supabase.from("admin_settings").select("key, value"),
      ]);

      setBalance(parseFloat(String(profileData?.balance ?? 0)) || 0);

      if (settingsRows) {
        const m: Record<string, string> = {};
        settingsRows.forEach((r: { key: string; value: string }) => { m[r.key] = r.value ?? ""; });
        setWdSettings({
          min_withdraw:         parseFloat(m["min_withdraw"]         ?? "10"),
          max_withdraw:         parseFloat(m["max_withdraw"]         ?? "10000"),
          withdraw_fee_percent: parseFloat(m["withdraw_fee_percent"] ?? "2"),
          withdraw_start_time:  m["withdraw_start_time"]             ?? "00:00",
          withdraw_end_time:    m["withdraw_end_time"]               ?? "23:59",
          withdrawal_min_hours: parseFloat(m["withdrawal_min_hours"] ?? "24"),
          withdrawal_max_hours: parseFloat(m["withdrawal_max_hours"] ?? "72"),
        });
      }
      setBalLoading(false);
    })();
  }, [user]);

  if (authLoading || balLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!user) return null;

  const amt         = Number(amount);
  const fee         = parseFloat(((amt * wdSettings.withdraw_fee_percent) / 100).toFixed(2));
  const netAmt      = parseFloat((amt - fee).toFixed(2));
  const withinHours = isWithinWindow(wdSettings.withdraw_start_time, wdSettings.withdraw_end_time);
  const isValid     = amount.trim() && !isNaN(amt) && amt >= wdSettings.min_withdraw && amt <= balance && wallet.trim() && withinHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim() || isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt < wdSettings.min_withdraw) { toast.error(`Minimum withdrawal is $${wdSettings.min_withdraw}`); return; }
    if (amt > wdSettings.max_withdraw) { toast.error(`Maximum withdrawal is $${wdSettings.max_withdraw.toLocaleString()}`); return; }
    if (amt > balance)                 { toast.error("Insufficient balance"); return; }
    if (!wallet.trim())                { toast.error("Enter your wallet address"); return; }
    if (!withinHours) {
      toast.error(`Withdrawals only available ${wdSettings.withdraw_start_time}–${wdSettings.withdraw_end_time}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from("withdrawals").insert({
        user_id:        user.id,
        amount:         amt,
        fee:            fee,
        wallet_address: wallet.trim(),
        network,
        status:         "pending",
      });

      if (insErr) {
        toast.error("Submission failed: " + insErr.message);
        setSubmitting(false); return;
      }

      const { error: balErr } = await supabase.rpc("increment_balance", {
        uid: user.id,
        inc: -amt,
      });
      if (balErr) {
        toast.error("Balance update failed, please contact support");
        setSubmitting(false); return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Network error — please try again");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#EFF6FF" }}>
            <Check size={32} style={{ color: B }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: B }}>Withdrawal Submitted!</h2>
          <p className="text-sm text-gray-500 mb-1">Status: <span className="font-bold text-yellow-600">Pending ⏳</span></p>
          <p className="text-xs text-gray-400 mb-1">
            Amount: <span className="font-semibold">${amt.toFixed(2)} USDT ({network})</span>
          </p>
          {fee > 0 && (
            <p className="text-xs text-gray-400 mb-1">
              Fee: <span className="font-semibold">${fee.toFixed(2)}</span> → Net: <span className="font-semibold text-green-600">${netAmt.toFixed(2)}</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5 mb-6 text-xs text-gray-400">
            <Clock size={12} />
            Processing: {wdSettings.withdrawal_min_hours}–{wdSettings.withdrawal_max_hours} hours
          </div>
          <button onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: R }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-gray-800 placeholder-gray-300";

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />
      <div className="max-w-md mx-auto px-4 pt-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            style={{ color: B }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: B }}>Withdraw USDT</h1>
            <p className="text-xs text-gray-400">Request a withdrawal to your wallet</p>
          </div>
        </div>

        <AnnouncementBanner />

        {/* Time window warning */}
        {!withinHours && (
          <div className="flex items-start gap-2 rounded-xl p-3 mb-4" style={{ background: "#FFF7ED" }}>
            <AlertCircle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700">
              Withdrawals are only available between{" "}
              <strong>{wdSettings.withdraw_start_time}</strong> and <strong>{wdSettings.withdraw_end_time}</strong> (UTC).
            </p>
          </div>
        )}

        {/* Balance Card */}
        <div className="rounded-2xl p-5 mb-4 flex items-center justify-between" style={{ background: B }}>
          <div>
            <p className="text-xs text-white opacity-60 mb-1">Available Balance</p>
            <p className="text-3xl font-extrabold text-white">${balance.toFixed(2)}</p>
            <p className="text-xs text-white opacity-40 mt-0.5">USDT</p>
          </div>
          <div className="text-right text-white opacity-60 text-xs space-y-0.5">
            <p>Min: ${wdSettings.min_withdraw}</p>
            <p>Max: ${wdSettings.max_withdraw.toLocaleString()}</p>
            {wdSettings.withdraw_fee_percent > 0 && <p>Fee: {wdSettings.withdraw_fee_percent}%</p>}
          </div>
        </div>

        {/* Network Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
          {(["TRC20", "BEP20"] as Network[]).map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: network === n ? B : "#fff", color: network === n ? "#fff" : "#6b7280" }}>
              {n}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (USDT)</label>
            <input
              type="number" placeholder={`Min $${wdSettings.min_withdraw}`}
              value={amount} onChange={e => setAmount(e.target.value)}
              className={inp} min={wdSettings.min_withdraw} max={Math.min(balance, wdSettings.max_withdraw)} step="0.01"
            />
            {amt > 0 && wdSettings.withdraw_fee_percent > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Fee: ${fee.toFixed(2)} → You receive: <span className="font-semibold text-green-600">${netAmt.toFixed(2)}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{network} Wallet Address</label>
            <input
              type="text" placeholder="Enter wallet address"
              value={wallet} onChange={e => setWallet(e.target.value)}
              className={inp}
            />
          </div>

          <button type="submit" disabled={!isValid || submitting}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: R }}>
            {submitting ? "Processing..." : `Withdraw $${amt > 0 ? amt.toFixed(2) : "0.00"} USDT`}
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center mt-3">
          Processing: {wdSettings.withdrawal_min_hours}–{wdSettings.withdrawal_max_hours} hours
        </p>
      </div>
    </div>
  );
}
