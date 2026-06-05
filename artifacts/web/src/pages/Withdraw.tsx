import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, ArrowDownToLine, Check, Clock } from "lucide-react";
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
      const [{ data: prof }, { data: settingsRows }] = await Promise.all([
        supabase.from("profiles").select("balance").eq("id", user.id).single(),
        supabase.from("admin_settings").select("key, value"),
      ]);
      setBalance(prof?.balance ?? 0);

      if (settingsRows) {
        const m: Record<string, string> = {};
        settingsRows.forEach((r: { key: string; value: string }) => { m[r.key] = r.value ?? ""; });
        setWdSettings({
          min_withdraw:         parseFloat(m.min_withdraw ?? "10"),
          max_withdraw:         parseFloat(m.max_withdraw ?? "10000"),
          withdrawal_min_hours: parseFloat(m.withdrawal_min_hours ?? "24"),
          withdrawal_max_hours: parseFloat(m.withdrawal_max_hours ?? "72"),
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

    setSubmitting(true);

    /* 1. Insert withdrawal request */
    const { error: wdErr } = await supabase.from("withdrawals").insert({
      user_id:        user.id,
      amount:         amt,
      wallet_address: wallet.trim(),
      network:        network,
      status:         "pending",
    });
    if (wdErr) { toast.error(wdErr.message); setSubmitting(false); return; }

    /* 2. Immediately deduct balance */
    const { error: balErr } = await supabase.rpc("increment_balance", { uid: user.id, inc: -amt });
    if (balErr) {
      /* withdrawal recorded but balance deduction failed — non-blocking */
      console.warn("Balance deduction failed:", balErr.message);
    }

    setSubmitting(false);
    setSubmitted(true);
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
          <ArrowDownToLine size={32} className="text-white opacity-30" />
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <p className="text-sm font-bold" style={{ color: B }}>Withdrawal Details</p>

          {/* Network Selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Network</label>
            <div className="grid grid-cols-2 gap-2">
              {(["TRC20", "BEP20"] as Network[]).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  className="py-2.5 text-sm font-bold rounded-xl border-2 transition-colors"
                  style={network === n
                    ? { background: B, color: "white", borderColor: B }
                    : { background: "white", color: "#9CA3AF", borderColor: "#E5E7EB" }
                  }
                >
                  {n === "TRC20" ? "TRC20 (TRON)" : "BEP20 (BSC)"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Amount (USDT)</label>
            <input
              type="number"
              placeholder={`Min $${wdSettings.min_withdraw} · Max $${balance.toFixed(2)}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inp}
              min={wdSettings.min_withdraw}
              step="any"
            />
            {amt > balance && amount && (
              <p className="text-xs text-red-500 mt-1">Insufficient balance</p>
            )}
            {amt < wdSettings.min_withdraw && amt > 0 && (
              <p className="text-xs text-red-500 mt-1">Minimum withdrawal: ${wdSettings.min_withdraw}</p>
            )}
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              Wallet Address ({network})
            </label>
            <input
              type="text"
              placeholder={network === "TRC20" ? "T... (TRON address)" : "0x... (BSC address)"}
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              className={inp}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: R }}
          >
            <ArrowDownToLine size={16} />
            {submitting ? "Submitting..." : "Submit Withdrawal Request"}
          </button>

          {/* Processing time */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} />
            Processing time: {wdSettings.withdrawal_min_hours}–{wdSettings.withdrawal_max_hours} hours
          </div>
        </form>

      </div>
    </div>
  );
}
