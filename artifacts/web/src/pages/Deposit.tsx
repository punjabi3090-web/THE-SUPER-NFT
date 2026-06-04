import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Copy, Check, Upload, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

type NetTab = "bep20" | "trc20";
type Settings = {
  usdt_bep20_address: string;
  usdt_trc20_address: string;
  bep20_qr_url: string;
  trc20_qr_url: string;
  min_withdraw: string;
};

export default function Deposit() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings]     = useState<Settings | null>(null);
  const [netTab, setNetTab]         = useState<NetTab>("bep20");
  const [amount, setAmount]         = useState("");
  const [copied, setCopied]         = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value");
      if (error || !data) return;
      const map: Record<string, string> = {};
      data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value ?? ""; });
      setSettings({
        usdt_bep20_address: map.usdt_bep20_address ?? "",
        usdt_trc20_address: map.usdt_trc20_address ?? "",
        bep20_qr_url:       map.bep20_qr_url ?? "",
        trc20_qr_url:       map.trc20_qr_url ?? "",
        min_withdraw:       map.min_withdraw ?? "10",
      });
    })();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${BRAND.red} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!user) return null;

  const activeAddress = netTab === "bep20"
    ? (settings?.usdt_bep20_address ?? "")
    : (settings?.usdt_trc20_address ?? "");
  const activeQr = netTab === "bep20"
    ? (settings?.bep20_qr_url ?? "")
    : (settings?.trc20_qr_url ?? "");

  const handleCopy = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
      toast.error("Minimum deposit is 10 USDT");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload a transaction screenshot");
      return;
    }

    setSubmitting(true);

    let screenshotUrl = "";
    try {
      const ext   = screenshot.name.split(".").pop() ?? "jpg";
      const path  = `${user.id}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("deposits")
        .upload(path, screenshot, { upsert: true });
      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from("deposits").getPublicUrl(uploadData.path);
        screenshotUrl = urlData.publicUrl;
      }
    } catch { /* storage bucket might not exist, continue without screenshot URL */ }

    const { error } = await supabase.from("deposits").insert({
      user_id: user.id,
      amount:  Number(amount),
      tx_hash: screenshotUrl || `SCREENSHOT_PENDING_${netTab.toUpperCase()}`,
      status:  "pending",
    });

    setSubmitting(false);
    if (error) { toast.error(error.message); return; }

    setSubmitted(true);
    toast.success("Deposit submitted! Admin will verify in 5–30 mins.");
  };

  const inp = `w-full bg-white text-gray-800 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] outline-none text-sm`;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BRAND.bg }}>
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F0FDF4" }}>
            <Check size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.blue }}>Deposit Submitted!</h2>
          <p className="text-sm text-gray-500 mb-2">Status: <span className="font-bold text-yellow-600">Pending ⏳</span></p>
          <p className="text-xs text-gray-400 mb-6">Admin will verify your deposit within 5–30 minutes. Your balance will be updated automatically.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: BRAND.red }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: BRAND.bg }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: BRAND.blue, border: "1px solid #e5e7eb" } }} />

      <div className="max-w-md mx-auto px-4 pt-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{ color: BRAND.blue }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: BRAND.blue }}>Deposit USDT</h1>
            <p className="text-xs text-gray-400">Send USDT to the address below</p>
          </div>
        </div>

        {/* Network Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="flex border-b border-gray-100">
            {(["bep20", "trc20"] as NetTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setNetTab(tab)}
                className="flex-1 py-3.5 text-sm font-bold transition-colors"
                style={{
                  color: netTab === tab ? BRAND.blue : "#9CA3AF",
                  borderBottom: netTab === tab ? `2px solid ${BRAND.red}` : "2px solid transparent",
                }}
              >
                {tab === "bep20" ? "BEP20 (BSC)" : "TRC20 (TRON)"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* QR Code */}
            {activeQr ? (
              <div className="flex justify-center mb-4">
                <img
                  src={activeQr}
                  alt="QR Code"
                  className="w-40 h-40 rounded-xl border border-gray-200 object-contain"
                />
              </div>
            ) : (
              <div
                className="w-40 h-40 mx-auto rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center mb-4"
              >
                <p className="text-xs text-gray-300 text-center px-2">QR Code<br />not set</p>
              </div>
            )}

            {/* Address */}
            <p className="text-xs text-gray-400 mb-1.5 font-medium">
              USDT {netTab.toUpperCase()} Address
            </p>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3 mb-3"
              style={{ background: BRAND.bg, border: "1px solid #e5e7eb" }}
            >
              <p className="text-xs font-mono flex-1 break-all" style={{ color: BRAND.blue }}>
                {activeAddress || "Address not configured yet"}
              </p>
              <button
                onClick={handleCopy}
                disabled={!activeAddress}
                className="flex-shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ background: "#FEF2F2", color: BRAND.red }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "#FEF2F2" }}>
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: BRAND.red }} />
              <p className="text-xs leading-relaxed" style={{ color: BRAND.red }}>
                Only send <strong>USDT</strong> to this address. Minimum deposit is <strong>10 USDT</strong>. Wrong network = lost funds.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <p className="text-sm font-bold mb-1" style={{ color: BRAND.blue }}>Confirm Your Deposit</p>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Amount (USDT)</label>
            <input
              type="number"
              placeholder="Minimum 10 USDT"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inp}
              min="10"
              step="any"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              Transaction Screenshot <span className="text-gray-400">(required)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed rounded-xl py-4 text-sm font-medium transition-colors"
              style={{ borderColor: screenshot ? BRAND.red : "#D1D5DB", color: screenshot ? BRAND.red : "#9CA3AF" }}
            >
              <Upload size={16} className="inline mr-2" />
              {screenshot ? screenshot.name : "Upload TXN Screenshot"}
            </button>
            {screenshot && (
              <img
                src={URL.createObjectURL(screenshot)}
                alt="preview"
                className="mt-2 w-full rounded-xl object-cover max-h-40 border border-gray-100"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !activeAddress}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: BRAND.red }}
          >
            <Upload size={16} />
            {submitting ? "Submitting..." : "Submit Deposit Request"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Admin verifies within 5–30 minutes
          </p>
        </form>
      </div>
    </div>
  );
}
