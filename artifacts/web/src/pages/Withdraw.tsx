import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { getCurrentUser, getCurrentUserId, submitWithdrawalRequest } from "../lib/api";
import { ArrowLeft, Check, Clock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AnnouncementBanner from "../components/AnnouncementBanner";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type Network = "BEP20" | "TRC20";

type WdSettings = {
  min_withdraw: number;
  max_withdraw: number;
  withdrawal_min_hours: number;
  withdrawal_max_hours: number;
};

const DEFAULT_WD: WdSettings = { min_withdraw: 10, max_withdraw: 10000, withdrawal_min_hours: 24, withdrawal_max_hours: 72 };

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
      const [apiUser, { data: settingsRows }] = await Promise.all([
        getCurrentUser(),
        supabase.from("admin_settings").select("key, value"),
      ]);
      setBalance(apiUser?.walletBalance ?? 0);

      if (settingsRows) {
        const m: Record<string, string> = {};
        settingsRows.forEach((r: { key: string; value: string }) => { m[r.key] = r.value ?? ""; });
        setWdSettings({
          min_withdraw:         parseFloat(m["min_withdraw"]         ?? "10"),
          max_withdraw:         parseFloat(m["max_withdraw"]         ?? "10000"),
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

  const amt = Number(amount);
  const isValid = amount.trim() && !isNaN(amt) && amt >= wdSettings.min_withdraw && amt <= balance && wallet.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim() || isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt < wdSettings.min_withdraw) { toast.error(`Minimum withdrawal is $${wdSettings.min_withdraw}`); return; }
    if (amt > wdSettings.max_withdraw) { toast.error(`Maximum withdrawal is $${wdSettings.max_withdraw}`); return; }
    if (amt > balance) { toast.error("Insufficient balance"); return; }
    if (!wallet.trim()) { toast.error("Enter your wallet address"); return; }

    const numericId = getCurrentUserId();
    if (!numericId) { toast.error("Session expired — please re-login"); return; }

    setSubmitting(true);
    const result = await submitWithdrawalRequest(numericId, amt, network, wallet.trim());
    setSubmitting(false);

    if (result === "ok") {
      setSubmitted(true);
    } else if (result === "insufficient") {
      toast.error("Insufficient balance");
    } else if (result === "min") {
      toast.error(`Minimum withdrawal is $${wdSettings.min_withdraw}`);
    } else if (result === "blocked") {
      toast.error("Your account is blocked");
    } else {
      toast.error("Withdrawal failed — please try again");
    }
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
          <div className="flex items-center justify-center gap-1.5 mb-6 text-xs text-gray-400">
            <Clock size={12} />
            Processing time: {wdSettings.withdrawal_min_hours}–{wdSettings.withdrawal_max_hours} hours
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

        {/* ── Header ── */}
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

        {/* ── Announcement Banner ── */}
        <AnnouncementBanner />

        {/* ── Balance Card ── */}
        <div className="rounded-2xl p-5 mb-4 flex items-center justify-between" style={{ background: B }}>
          <div>
            <p className="text-xs text-white opacity-60 mb-1">Available Balance</p>
            <p className="text-3xl font-extrabold text-white">${balance.toFixed(2)}</p>
            <p className="text-xs text-white opacity-40 mt-0.5">USDT</p>
          </div>
          <div className="text-right text-white opacity-60 text-xs space-y-0.5">
            <p>Min: ${wdSettings.min_withdraw}</p>
            <p>Max: ${wdSettings.max_withdraw.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Network Tabs ── */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
          {(["TRC20", "BEP20"] as Network[]).map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: network === n ? B : "#fff", color: network === n ? "#fff" : "#6b7280" }}>
              {n}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (USDT)</label>
            <input
              type="number" placeholder={`Min $${wdSettings.min_withdraw}`}
              value={amount} onChange={e => setAmount(e.target.value)}
              className={inp} min={wdSettings.min_withdraw} max={balance} step="0.01"
            />
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
          Processing time: {wdSettings.withdrawal_min_hours}–{wdSettings.withdrawal_max_hours} hours
        </p>
      </div>
    </div>
  );
}
