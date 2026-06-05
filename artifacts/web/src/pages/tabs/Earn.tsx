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
      const { data } = await supabase.from("profiles").select("referral_code").eq("user_id", user.id).single();
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
    <div className="max-w-md mx-auto px-3 pt-3 pb-2" style={{ background: "#F8F9FA", minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: "#1E3A8A", border: "1px solid #e5e7eb" } }} />

      {/* ── Header ── */}
      <div className="flex items-center gap-2 h-14 mb-2">
        <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
        <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          THE SUPER NFT
        </h1>
      </div>

      {/* ── Coming Soon Card ── */}
      <div className="rounded-xl p-4 mb-3 text-center relative overflow-hidden" style={{ background: "#1E3A8A" }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Zap size={120} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)" }}>
            <Zap size={22} style={{ color: "#DC2626" }} />
          </div>
          <h2 className="text-sm font-bold text-white mb-1">Coming Soon</h2>
          <p className="text-white/70 text-xs leading-relaxed">
            New earning features on the way — staking, yield farming, and more.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-white/80 text-[10px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            In Development
          </div>
        </div>
      </div>

      {/* ── Referral Section ── */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} style={{ color: "#DC2626" }} />
          <p className="text-xs font-bold" style={{ color: "#1E3A8A" }}>My Referral Link</p>
        </div>

        {/* Commission Tiers */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { level: "Level 1", pct: "10%", bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
            { level: "Level 2", pct: "5%",  bg: "#EFF6FF", border: "#BFDBFE", color: "#1E3A8A" },
            { level: "Level 3", pct: "2%",  bg: "#F0FDF4", border: "#BBF7D0", color: "#16a34a" },
          ].map(t => (
            <div key={t.level} className="rounded-xl px-2 py-2 text-center border"
              style={{ background: t.bg, borderColor: t.border }}>
              <p className="text-sm font-bold" style={{ color: t.color }}>{t.pct}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.level}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "#F8F9FA", border: "1px solid #e5e7eb" }}>
          <p className="text-[10px] font-mono flex-1 truncate text-gray-500">{refLink || "Loading..."}</p>
          <button onClick={handleCopy} disabled={!refLink} className="flex-shrink-0 p-1" style={{ color: "#DC2626" }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Share your link and earn commissions when they buy NFTs
        </p>
      </div>
    </div>
  );
}
