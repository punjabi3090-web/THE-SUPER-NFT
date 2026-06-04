import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Copy, Check, Users, Zap } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function EarnTab() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("referral_code").eq("id", user.id).single();
      setReferralCode(data?.referral_code ?? null);
    })();
  }, []);

  const refLink = referralCode ? `${window.location.origin}/login?ref=${referralCode}` : "";

  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4" style={{ background: "#F8F9FA", minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: "#1E3A8A", border: "1px solid #e5e7eb" } }} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>Earn</h1>
        <p className="text-gray-500 text-sm mt-1">Grow your income with referrals</p>
      </div>

      {/* ── Coming Soon Card ── */}
      <div
        className="rounded-3xl p-8 mb-5 text-center relative overflow-hidden"
        style={{ background: "#1E3A8A" }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Zap size={200} className="text-white" />
        </div>
        <div className="relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)" }}
          >
            <Zap size={28} style={{ color: "#DC2626" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            New earning features are on the way. Stay tuned for staking, yield farming, and more ways to grow your assets.
          </p>
          <div
            className="mt-5 inline-flex items-center gap-2 text-white/80 text-xs font-semibold px-4 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            In Development
          </div>
        </div>
      </div>

      {/* ── Referral Section ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: "#DC2626" }} />
          <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>My Referral Link</p>
        </div>

        {/* Commission Tiers */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { level: "Level 1", pct: "10%" },
            { level: "Level 2", pct: "5%"  },
            { level: "Level 3", pct: "2%"  },
          ].map((t, i) => (
            <div
              key={t.level}
              className="rounded-xl px-3 py-2.5 text-center border"
              style={{
                background: i === 0 ? "#FEF2F2" : i === 1 ? "#EFF6FF" : "#F0FDF4",
                borderColor: i === 0 ? "#FECACA" : i === 1 ? "#BFDBFE" : "#BBF7D0",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: i === 0 ? "#DC2626" : i === 1 ? "#1E3A8A" : "#16a34a" }}
              >
                {t.pct}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.level}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl px-3 py-3 flex items-center gap-2" style={{ background: "#F8F9FA", border: "1px solid #e5e7eb" }}>
          <p className="text-xs font-mono flex-1 truncate text-gray-500">{refLink || "Loading..."}</p>
          <button
            onClick={handleCopy}
            disabled={!refLink}
            className="flex-shrink-0 p-1 transition-colors"
            style={{ color: "#DC2626" }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Share your link and earn commissions when they buy NFTs
        </p>
      </div>
    </div>
  );
}
