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
    <div className="max-w-md mx-auto px-4 pt-10 pb-4">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#fff", border: "1px solid #334155" } }} />

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Earn</h1>
        <p className="text-slate-400 text-sm mt-1">Grow your income with referrals</p>
      </div>

      {/* ── Coming Soon Card ── */}
      <div
        className="rounded-3xl p-8 mb-5 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Zap size={200} />
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Coming Soon</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            New earning features are on the way. Stay tuned for staking, yield farming, and more ways to grow your assets.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            In Development
          </div>
        </div>
      </div>

      {/* ── Referral Section ── */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-purple-400" />
          <p className="text-sm font-semibold text-white">My Referral Link</p>
        </div>

        {/* Commission Tiers */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { level: "Level 1", pct: "10%", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            { level: "Level 2", pct: "5%",  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { level: "Level 3", pct: "2%",  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          ].map(t => (
            <div key={t.level} className={`rounded-xl border px-3 py-2.5 text-center ${t.color}`}>
              <p className="text-sm font-extrabold">{t.pct}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{t.level}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-700/60 rounded-xl px-3 py-3 flex items-center gap-2">
          <p className="text-xs text-slate-300 font-mono flex-1 truncate">{refLink || "Loading..."}</p>
          <button
            onClick={handleCopy}
            disabled={!refLink}
            className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0 p-1"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Share your link and earn commissions when they buy NFTs
        </p>
      </div>
    </div>
  );
}
