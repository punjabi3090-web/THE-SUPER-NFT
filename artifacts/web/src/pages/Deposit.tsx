import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Copy, Check, Zap, Clock, AlertCircle, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AnnouncementBanner from "../components/AnnouncementBanner";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

type NetTab = "bep20" | "trc20";

type PaymentInfo = {
  address:   string;
  amount:    number;
  qr:        string;
  paymentId: string;
  currency:  string;
};

type PaymentStatus = "idle" | "generating" | "waiting" | "confirming" | "confirmed" | "sending" | "partially_paid" | "finished" | "failed" | "expired";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  waiting:       { label: "Waiting for payment…",     color: "#eab308" },
  confirming:    { label: "Confirming on chain…",     color: "#3b82f6" },
  confirmed:     { label: "Confirmed!",                color: "#22c55e" },
  sending:       { label: "Sending…",                  color: "#3b82f6" },
  partially_paid:{ label: "Partial payment received",  color: "#f97316" },
  finished:      { label: "Payment complete ✓",        color: "#22c55e" },
  failed:        { label: "Payment failed",            color: BRAND.red  },
  expired:       { label: "Payment expired",           color: "#9ca3af"  },
};

const getNftLevel = (amt: number) => {
  if (amt >= 2000) return { label: "Level 4 — 2.0% daily", daily: amt * 0.02 };
  if (amt >= 500)  return { label: "Level 3 — 1.5% daily", daily: amt * 0.015 };
  if (amt >= 100)  return { label: "Level 2 — 1.2% daily", daily: amt * 0.012 };
  return              { label: "Level 1 — 1.0% daily", daily: amt * 0.01 };
};

export default function Deposit() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [netTab,     setNetTab]     = useState<NetTab>("bep20");
  const [amount,     setAmount]     = useState("");
  const [payment,    setPayment]    = useState<PaymentInfo | null>(null);
  const [status,     setStatus]     = useState<PaymentStatus>("idle");
  const [copied,     setCopied]     = useState(false);
  const [polling,    setPolling]    = useState(false);
  const [minDeposit, setMinDeposit] = useState(10);
  const [maxDeposit, setMaxDeposit] = useState(50000);
  const [showFallback, setShowFallback] = useState(false);

  /* Manual wallet addresses for fallback */
  const [manualBep20Addr, setManualBep20Addr] = useState("");
  const [manualTrc20Addr, setManualTrc20Addr] = useState("");
  const [manualBep20Qr,   setManualBep20Qr]   = useState("");
  const [manualTrc20Qr,   setManualTrc20Qr]   = useState("");

  useEffect(() => {
    supabase.from("admin_settings").select("key, value")
      .in("key", ["min_deposit", "max_deposit", "usdt_bep20_address", "usdt_trc20_address", "bep20_qr_url", "trc20_qr_url"])
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, string> = {};
        data.forEach((r: { key: string; value: string }) => { m[r.key] = r.value; });
        if (m["min_deposit"])        setMinDeposit(parseFloat(m["min_deposit"]));
        if (m["max_deposit"])        setMaxDeposit(parseFloat(m["max_deposit"]));
        if (m["usdt_bep20_address"]) setManualBep20Addr(m["usdt_bep20_address"]);
        if (m["usdt_trc20_address"]) setManualTrc20Addr(m["usdt_trc20_address"]);
        if (m["bep20_qr_url"])       setManualBep20Qr(m["bep20_qr_url"]);
        if (m["trc20_qr_url"])       setManualTrc20Qr(m["trc20_qr_url"]);
      });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${BRAND.red} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!user) return null;

  const parsedAmt = Number(amount);
  const nftInfo   = !isNaN(parsedAmt) && parsedAmt >= minDeposit ? getNftLevel(parsedAmt) : null;

  const handleGenerate = async () => {
    if (!amount || isNaN(parsedAmt) || parsedAmt < minDeposit) {
      toast.error(`Minimum deposit is $${minDeposit} USDT`); return;
    }
    if (parsedAmt > maxDeposit) {
      toast.error(`Maximum deposit is $${maxDeposit.toLocaleString()} USDT`); return;
    }

    setStatus("generating");
    setPayment(null);
    setShowFallback(false);

    try {
      const res = await fetch("/api/create-payment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  parsedAmt,
          userId:  user.id,
          network: netTab === "bep20" ? "usdtbsc" : "usdttrc20",
        }),
      });

      const data = await res.json() as { address?: string; amount?: number; qr?: string; paymentId?: string; currency?: string; error?: string };

      if (!res.ok || data.error) {
        /* Auto-payment failed — show manual fallback */
        const manualAddr = netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
        if (manualAddr) {
          setShowFallback(true);
          toast("Auto deposit unavailable. Use the manual address below.", { icon: "ℹ️" });
        } else {
          toast.error(data.error ?? "Failed to generate payment address");
        }
        setStatus("idle"); return;
      }

      setPayment({
        address:   data.address!,
        amount:    data.amount!,
        qr:        data.qr!,
        paymentId: data.paymentId!,
        currency:  data.currency!,
      });
      setStatus("waiting");
      startPolling(data.paymentId!);
    } catch {
      /* Network error — show manual fallback if addresses are configured */
      const manualAddr = netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
      if (manualAddr) {
        setShowFallback(true);
        toast("Auto deposit unavailable. Use the manual address below.", { icon: "ℹ️" });
      } else {
        toast.error("Network error. Please try again.");
      }
      setStatus("idle");
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 120;

    const poll = async () => {
      try {
        const res  = await fetch(`/api/nowpayments/status/${paymentId}`, { cache: "no-store" });
        const data = await res.json() as { status?: string };
        const st   = data.status ?? "waiting";
        setStatus(st as PaymentStatus);
        if (st === "finished" || st === "confirmed") {
          toast.success("Payment confirmed! Your balance has been updated.");
          setPolling(false); return;
        }
        if (st === "failed" || st === "expired") {
          toast.error(`Payment ${st}. Please try again.`);
          setPolling(false); return;
        }
      } catch { /* ignore */ }
      attempts++;
      if (attempts < MAX_ATTEMPTS) setTimeout(poll, 30_000);
      else setPolling(false);
    };
    setTimeout(poll, 30_000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPayment(null);
    setStatus("idle");
    setAmount("");
    setPolling(false);
    setShowFallback(false);
  };

  const statusInfo    = payment ? STATUS_LABEL[status] ?? STATUS_LABEL["waiting"] : null;
  const currentManualAddr = netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
  const currentManualQr   = netTab === "bep20" ? manualBep20Qr   : manualTrc20Qr;

  return (
    <div className="min-h-screen pb-8" style={{ background: BRAND.bg }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: BRAND.blue, border: "1px solid #e5e7eb" } }} />

      <div className="max-w-md mx-auto px-4 pt-10">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{ color: BRAND.blue }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: BRAND.blue }}>Deposit USDT</h1>
            <p className="text-xs text-gray-400">Auto-confirmed via NowPayments</p>
          </div>
        </div>

        <AnnouncementBanner />

        {/* ── STEP 1: Network + Amount ── */}
        {!payment && !showFallback && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
              <div className="flex border-b border-gray-100">
                {(["bep20", "trc20"] as NetTab[]).map(tab => (
                  <button key={tab} onClick={() => setNetTab(tab)}
                    className="flex-1 py-3.5 text-sm font-bold transition-colors"
                    style={{
                      color: netTab === tab ? BRAND.blue : "#9CA3AF",
                      borderBottom: netTab === tab ? `2px solid ${BRAND.red}` : "2px solid transparent",
                    }}>
                    {tab === "bep20" ? "BEP20 (BSC)" : "TRC20 (TRON)"}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-medium">Amount (USDT)</label>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Min: ${minDeposit} · Max: ${maxDeposit.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder={`Min $${minDeposit} USDT`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-800 outline-none text-sm"
                    min={minDeposit}
                    step="any"
                  />
                  {nftInfo && (
                    <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                      <span className="text-green-600 font-bold text-xs">NFT {nftInfo.label}</span>
                      <span className="text-green-500 text-xs">· Daily: ${nftInfo.daily.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "#FEF2F2" }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: BRAND.red }} />
                  <p className="text-xs leading-relaxed" style={{ color: BRAND.red }}>
                    Only send <strong>USDT</strong> on the selected network. Wrong network = lost funds.
                    Minimum <strong>${minDeposit} USDT</strong>.
                  </p>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={status === "generating" || !amount || parsedAmt < minDeposit}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: BRAND.red }}>
                  {status === "generating"
                    ? <><RefreshCw size={15} className="animate-spin" /> Generating address…</>
                    : <><Zap size={15} /> Generate Payment Address</>
                  }
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-bold mb-3" style={{ color: BRAND.blue }}>How it works</p>
              {[
                ["1", "Enter amount & click Generate"],
                ["2", "Send exact USDT to shown address"],
                ["3", "Balance auto-updates on confirmation"],
              ].map(([n, t]) => (
                <div key={n} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: BRAND.red }}>{n}</span>
                  <p className="text-xs text-gray-500">{t}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl p-6" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "#2563EB" }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Deposit Rules
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Minimum Deposit:</strong> $50 USDT</li>
                <li>• <strong>BEP-20 Network:</strong> No network charges apply. The full deposit amount will be credited to your account.</li>
                <li>• <strong>TRC-20 Network:</strong> A $1 USDT network charge will be deducted from your deposit amount.</li>
              </ul>
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="font-semibold text-sm mb-2" style={{ color: "#CA8A04" }}>Note</p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Please double-check the network and wallet address before making a deposit. The company will not be held responsible for any funds sent to the wrong network or an incorrect address.</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* ── FALLBACK: Manual addresses ── */}
        {!payment && showFallback && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl p-4"
              style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-orange-500" />
              <div>
                <p className="text-sm font-bold text-orange-700 mb-0.5">Auto deposit unavailable</p>
                <p className="text-xs text-orange-600">
                  Please send <strong>${parsedAmt} USDT</strong> manually to the address below.
                  Then contact support with your transaction hash.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex border-b border-gray-100">
                {(["bep20", "trc20"] as NetTab[]).map(tab => (
                  <button key={tab} onClick={() => setNetTab(tab)}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={{
                      color: netTab === tab ? BRAND.blue : "#9CA3AF",
                      borderBottom: netTab === tab ? `2px solid ${BRAND.red}` : "2px solid transparent",
                    }}>
                    {tab === "bep20" ? "BEP20 (BSC)" : "TRC20 (TRON)"}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {currentManualAddr ? (
                  <>
                    {currentManualQr && (
                      <div className="flex justify-center mb-4">
                        <img src={currentManualQr} alt="QR"
                          className="w-40 h-40 rounded-xl border border-gray-200 object-contain" />
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mb-1.5 font-medium">
                      {netTab === "bep20" ? "BEP20 (BSC)" : "TRC20 (TRON)"} Address
                    </p>
                    <div className="rounded-xl px-4 py-3 flex items-center gap-3 mb-4"
                      style={{ background: BRAND.bg, border: "1px solid #e5e7eb" }}>
                      <p className="text-xs font-mono flex-1 break-all" style={{ color: BRAND.blue }}>
                        {currentManualAddr}
                      </p>
                      <button onClick={() => handleCopy(currentManualAddr)}
                        className="flex-shrink-0 p-2 rounded-lg transition-colors"
                        style={{ background: "#FEF2F2", color: BRAND.red }}>
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "#FEF2F2" }}>
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: BRAND.red }} />
                      <p className="text-xs leading-relaxed" style={{ color: BRAND.red }}>
                        Send exactly <strong>${parsedAmt} USDT</strong> on <strong>{netTab === "bep20" ? "BSC" : "TRON"}</strong>.
                        After sending, contact support with your transaction ID.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Manual address not configured. Please contact support.
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleReset}
              className="w-full py-3 rounded-xl font-bold text-sm border border-gray-200 bg-white"
              style={{ color: BRAND.blue }}>
              ← Try Again
            </button>
          </div>
        )}

        {/* ── STEP 2: Auto payment address shown ── */}
        {payment && (
          <div className="space-y-4">
            {statusInfo && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                {(status === "waiting" || status === "confirming") && (
                  <RefreshCw size={13} className="animate-spin flex-shrink-0" style={{ color: statusInfo.color }} />
                )}
                {(status === "finished" || status === "confirmed") && (
                  <Check size={13} className="flex-shrink-0" style={{ color: statusInfo.color }} />
                )}
                {(status === "failed" || status === "expired") && (
                  <AlertCircle size={13} className="flex-shrink-0" style={{ color: statusInfo.color }} />
                )}
                <p className="text-xs font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</p>
                {polling && <span className="ml-auto text-[10px] text-gray-400">Checking…</span>}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: BRAND.blue }}>
                  {netTab === "bep20" ? "BEP20 (BSC)" : "TRC20 (TRON)"} — USDT
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "#FEF2F2", color: BRAND.red }}>
                  {payment.amount} {payment.currency.toUpperCase()}
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-center mb-4">
                  <img src={payment.qr} alt="QR Code"
                    className="w-44 h-44 rounded-xl border border-gray-200 object-contain" />
                </div>

                <div className="rounded-xl px-4 py-2.5 mb-3 text-center"
                  style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="text-xs text-gray-500">Send exactly</p>
                  <p className="text-lg font-extrabold" style={{ color: BRAND.blue }}>{payment.amount} USDT</p>
                  <p className="text-[10px] text-gray-400">Any other amount may not be credited</p>
                </div>

                <p className="text-xs text-gray-400 mb-1.5 font-medium">Payment Address</p>
                <div className="rounded-xl px-4 py-3 flex items-center gap-3 mb-4"
                  style={{ background: BRAND.bg, border: "1px solid #e5e7eb" }}>
                  <p className="text-xs font-mono flex-1 break-all" style={{ color: BRAND.blue }}>
                    {payment.address}
                  </p>
                  <button onClick={() => handleCopy(payment.address)}
                    className="flex-shrink-0 p-2 rounded-lg transition-colors"
                    style={{ background: "#FEF2F2", color: BRAND.red }}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>

                <div className="flex items-start gap-2 rounded-xl p-3 mb-4" style={{ background: "#FEF2F2" }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: BRAND.red }} />
                  <p className="text-xs leading-relaxed" style={{ color: BRAND.red }}>
                    Send <strong>exactly {payment.amount} USDT</strong> to this address on{" "}
                    <strong>{netTab === "bep20" ? "BSC" : "TRON"}</strong> network only.
                    Your balance updates automatically after confirmation.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl p-3"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <Clock size={13} className="flex-shrink-0 text-green-600" />
                  <p className="text-xs text-green-700">
                    Balance auto-updates after blockchain confirmation — no admin needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleReset}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 bg-white"
                style={{ color: BRAND.blue }}>
                New Deposit
              </button>
              <button onClick={() => navigate("/")}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: BRAND.red }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
