import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Check, Clock, AlertCircle, Lock, Wallet } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AnnouncementBanner from "../components/AnnouncementBanner";

const R  = "#DC2626";
const B  = "#1E3A8A";
const BG = "#F8F9FA";

type Network = "BEP20" | "TRC20";

type WdSettings = {
  min_withdraw:          number;
  max_withdraw:          number;
  withdraw_fee_percent:  number;
  withdraw_process_hours: number;
};

type BindAddr = {
  bep20_address: string | null;
  trc20_address: string | null;
  bind_at:       string | null;
};

const DEFAULT_WD: WdSettings = {
  min_withdraw:           10,
  max_withdraw:           10000,
  withdraw_fee_percent:   2,
  withdraw_process_hours: 24,
};

export default function Withdraw() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [balance,     setBalance]     = useState(0);
  const [balLoading,  setBalLoading]  = useState(true);
  const [wdSettings,  setWdSettings]  = useState<WdSettings>(DEFAULT_WD);

  const [bindAddr,    setBindAddr]    = useState<BindAddr | null | undefined>(undefined);
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);

  const [network,    setNetwork]    = useState<Network>("TRC20");
  const [amount,     setAmount]     = useState("");
  const [totpCode,   setTotpCode]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [
        { data: profileData },
        { data: settingsRows },
        { data: bindData },
      ] = await Promise.all([
        supabase.from("profiles").select("balance, totp_enabled").eq("user_id", user.id).single(),
        supabase.from("admin_settings").select("key, value"),
        supabase.from("user_withdraw_addresses")
          .select("bep20_address, trc20_address, bind_at")
          .eq("user_id", user.id).single(),
      ]);

      setBalance(parseFloat(String(profileData?.balance ?? 0)) || 0);
      setTotpEnabled(!!profileData?.totp_enabled);

      if (settingsRows) {
        const m: Record<string, string> = {};
        settingsRows.forEach((r: { key: string; value: string }) => { m[r.key] = r.value ?? ""; });
        setWdSettings({
          min_withdraw:           parseFloat(m["min_withdraw"]           ?? "10"),
          max_withdraw:           parseFloat(m["max_withdraw"]           ?? "10000"),
          withdraw_fee_percent:   parseFloat(m["withdraw_fee_percent"]   ?? "2"),
          withdraw_process_hours: parseFloat(m["withdraw_process_hours"] ?? "24"),
        });
      }

      setBindAddr(bindData ?? null);

      if (bindData) {
        const hasBep20 = !!bindData.bep20_address;
        const hasTrc20 = !!bindData.trc20_address;
        if (!hasTrc20 && hasBep20) setNetwork("BEP20");
        else setNetwork("TRC20");
      }

      setBalLoading(false);
    })();
  }, [user]);

  if (authLoading || balLoading || bindAddr === undefined || totpEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!user) return null;

  const hasBind  = !!(bindAddr && (bindAddr.bep20_address || bindAddr.trc20_address));
  const bindMs   = bindAddr?.bind_at ? Date.now() - new Date(bindAddr.bind_at).getTime() : 0;
  const bindH    = Math.floor(bindMs / 3600000);
  const bindMin  = Math.floor((bindMs % 3600000) / 60000);
  const remH     = Math.max(0, 72 - bindH);
  const remMin   = bindH < 72 ? Math.max(0, 60 - bindMin) : 0;
  const unlocked = hasBind && bindH >= 72;

  const availableNetworks = (["TRC20", "BEP20"] as Network[]).filter(n =>
    n === "BEP20" ? !!bindAddr?.bep20_address : !!bindAddr?.trc20_address
  );
  const wallet = network === "BEP20"
    ? (bindAddr?.bep20_address ?? "")
    : (bindAddr?.trc20_address ?? "");

  const amt    = Number(amount);
  const fee    = parseFloat(((amt * wdSettings.withdraw_fee_percent) / 100).toFixed(2));
  const netAmt = parseFloat((amt - fee).toFixed(2));
  const isValid = amount.trim() && !isNaN(amt) && amt >= wdSettings.min_withdraw
    && amt <= balance && wallet && totpCode.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim() || isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt < wdSettings.min_withdraw) { toast.error(`Min withdrawal is $${wdSettings.min_withdraw}`); return; }
    if (amt > wdSettings.max_withdraw) { toast.error(`Max withdrawal is $${wdSettings.max_withdraw.toLocaleString()}`); return; }
    if (amt > balance)                 { toast.error("Insufficient balance"); return; }
    if (!wallet)                       { toast.error("No bound address for this network"); return; }
    if (totpCode.length !== 6)         { toast.error("Enter your 6-digit Google Auth code"); return; }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const totpRes = await fetch("/api/2fa/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? ""}` },
        body:    JSON.stringify({ token: totpCode }),
      });
      const totpData = await totpRes.json() as { valid?: boolean; error?: string };
      if (!totpData.valid) {
        toast.error("Invalid Google Auth code — please try again");
        setSubmitting(false); return;
      }
    } catch {
      toast.error("Network error — could not validate 2FA");
      setSubmitting(false); return;
    }

    const { error: insErr } = await supabase.from("withdrawals").insert({
      user_id:        user.id,
      amount:         amt,
      fee:            fee,
      wallet_address: wallet,
      network,
      status:         "pending",
    });

    if (insErr) {
      toast.error("Submission failed: " + insErr.message);
      setSubmitting(false); return;
    }

    const { error: balErr } = await supabase.rpc("increment_balance", { uid: user.id, inc: -amt });
    if (balErr) {
      toast.error("Balance update failed — contact support");
      setSubmitting(false); return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-gray-800 placeholder-gray-300";

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
              Fee: <span className="font-semibold">${fee.toFixed(2)}</span> → Net:{" "}
              <span className="font-semibold text-green-600">${netAmt.toFixed(2)}</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5 mb-6 text-xs text-gray-400">
            <Clock size={12} />
            Processed within {wdSettings.withdraw_process_hours} hours
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

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />
      <div className="max-w-md mx-auto px-4 pt-10">

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            style={{ color: B }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: B }}>Withdraw USDT</h1>
            <p className="text-xs text-gray-400">Request a withdrawal to your bound wallet</p>
          </div>
        </div>

        <AnnouncementBanner />

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

        {/* ── Guard: No bind address ── */}
        {!hasBind && (
          <div className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#FFF7ED" }}>
              <Wallet size={22} style={{ color: "#D97706" }} />
            </div>
            <p className="text-sm font-bold" style={{ color: B }}>Withdrawal Address Required</p>
            <p className="text-xs text-gray-500">
              You must bind a withdrawal address in your Profile before requesting a withdrawal.
            </p>
            <button onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: R }}>
              Go to Profile → Bind Address
            </button>
          </div>
        )}

        {/* ── Guard: 72hr lock ── */}
        {hasBind && !unlocked && (
          <div className="bg-white rounded-2xl p-5 border border-yellow-200 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#FEFCE8" }}>
              <Clock size={22} style={{ color: "#CA8A04" }} />
            </div>
            <p className="text-sm font-bold" style={{ color: B }}>72-Hour Security Hold</p>
            <p className="text-xs text-gray-500">
              Your withdrawal address was recently bound. A 72-hour hold is in place for security.
            </p>
            <div className="rounded-xl py-3 px-4" style={{ background: "#FEFCE8" }}>
              <p className="text-lg font-bold" style={{ color: "#CA8A04" }}>
                {remH}h {remMin}m remaining
              </p>
              <p className="text-[10px] text-yellow-700 mt-0.5">Address bound {bindH}h {bindMin}m ago</p>
            </div>
          </div>
        )}

        {/* ── Guard: 2FA not enabled ── */}
        {hasBind && unlocked && !totpEnabled && (
          <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#FEF2F2" }}>
              <Lock size={22} style={{ color: R }} />
            </div>
            <p className="text-sm font-bold" style={{ color: B }}>Google Authenticator Required</p>
            <p className="text-xs text-gray-500">
              Enable 2FA in your Profile to secure withdrawals with Google Authenticator.
            </p>
            <button onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: R }}>
              Go to Profile → Enable 2FA
            </button>
          </div>
        )}

        {/* ── Withdraw Form (all guards passed) ── */}
        {hasBind && unlocked && totpEnabled && (
          <>
            {/* Security badges */}
            <div className="flex gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 flex-1">
                <Wallet size={11} className="text-green-600" />
                <span className="text-[10px] font-semibold text-green-700">Address Bound</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 flex-1">
                <Lock size={11} className="text-green-600" />
                <span className="text-[10px] font-semibold text-green-700">2FA Active</span>
              </div>
            </div>

            {/* Network Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
              {availableNetworks.map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                  style={{ background: network === n ? B : "#fff", color: network === n ? "#fff" : "#6b7280" }}>
                  {n}
                </button>
              ))}
            </div>

            {/* Bound wallet display */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet size={11} className="text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  {network} Withdrawal Address
                </p>
              </div>
              <p className="text-xs font-mono text-gray-700 break-all">{wallet || "—"}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                To change address, go to Profile → Withdrawal Address Bind (72hr hold resets)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (USDT)</label>
                <input
                  type="number" placeholder={`Min $${wdSettings.min_withdraw}`}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className={inp} min={wdSettings.min_withdraw}
                  max={Math.min(balance, wdSettings.max_withdraw)} step="0.01"
                />
                {amt > 0 && wdSettings.withdraw_fee_percent > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Fee: ${fee.toFixed(2)} → You receive:{" "}
                    <span className="font-semibold text-green-600">${netAmt.toFixed(2)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1.5">
                  <Lock size={11} /> Google Auth Code
                </label>
                <input
                  type="text" inputMode="numeric" placeholder="6-digit code"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={inp + " text-center tracking-widest font-mono"}
                  maxLength={6}
                />
              </div>

              <button type="submit" disabled={!isValid || submitting}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: R }}>
                {submitting ? "Processing..." : `Withdraw $${amt > 0 ? amt.toFixed(2) : "0.00"} USDT`}
              </button>
            </form>
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-4">
          <AlertCircle size={11} className="text-gray-300" />
          <p className="text-[10px] text-gray-400">
            Processed within {wdSettings.withdraw_process_hours} hours
          </p>
        </div>
      </div>
    </div>
  );
}
