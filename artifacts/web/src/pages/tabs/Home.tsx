import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { DollarSign, Sparkles, RefreshCw, ArrowDownLeft, ArrowUpRight, Clock, TrendingUp } from "lucide-react";

type Profile = { balance: number | null; full_name: string | null; referral_code: string | null };
type Tx      = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function HomeTab() {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [txs, setTxs]           = useState<Tx[]>([]);
  const [loading, setLoading]   = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const [{ data: prof }, { data: txData }] = await Promise.all([
      supabase.from("profiles").select("balance, full_name, referral_code").eq("id", user.id).single(),
      supabase.from("transactions").select("id, type, amount, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    setProfile(prof ?? null);
    setTxs((txData ?? []) as Tx[]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async () => {
    setClaiming(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setClaiming(false); return; }

    const { data, error } = await supabase.rpc("claim_user_profit", { p_user_id: user.id });

    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      const amount = Number(data ?? 0);
      if (amount > 0) {
        toast.success(`Claimed $${amount.toFixed(2)} ✓`);
        load();
      } else {
        toast("No pending profit to claim.", { icon: "ℹ️" });
      }
    }
    setClaiming(false);
  };

  const txIcon = (type: string) => {
    if (type === "nft_profit") return <TrendingUp size={14} className="text-emerald-400" />;
    if (type === "deposit")    return <ArrowDownLeft size={14} className="text-blue-400" />;
    if (type === "withdraw")   return <ArrowUpRight size={14} className="text-red-400" />;
    return <Clock size={14} className="text-slate-400" />;
  };

  const txColor = (type: string) => {
    if (type === "nft_profit" || type === "deposit") return "text-emerald-400";
    if (type === "withdraw") return "text-red-400";
    return "text-slate-300";
  };

  const txSign = (type: string) => (type === "withdraw" ? "-" : "+");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const balance = profile?.balance ?? 0;

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#fff", border: "1px solid #334155" } }} />

      {/* ── Greeting ── */}
      <div className="mb-6">
        <p className="text-slate-400 text-sm">Welcome back</p>
        <h1 className="text-2xl font-extrabold text-white">
          {profile?.full_name?.split(" ")[0] ?? "User"} 👋
        </h1>
      </div>

      {/* ── Balance Card ── */}
      <div
        className="rounded-3xl p-6 mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2 opacity-70">
            <DollarSign size={14} />
            <p className="text-xs font-medium">Wallet Balance</p>
          </div>
          <p className="text-5xl font-extrabold tracking-tight">${balance.toFixed(2)}</p>
          <p className="text-xs opacity-50 mt-1.5">USDT</p>
        </div>
      </div>

      {/* ── Claim Button ── */}
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full flex items-center justify-center gap-2.5 font-bold text-sm rounded-2xl py-4 mb-5 transition-all
          bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
          text-white disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
      >
        {claiming
          ? <><RefreshCw size={16} className="animate-spin" /> Claiming...</>
          : <><Sparkles size={16} /> Claim Profit</>
        }
      </button>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { emoji: "💰", label: "Deposit",  path: "/deposit" },
          { emoji: "💸", label: "Withdraw", path: "/withdraw" },
          { emoji: "🖼️", label: "NFT",     path: "/nft" },
        ].map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-colors active:scale-95"
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[11px] text-slate-300 font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Recent Transactions</p>
          <span className="text-xs text-slate-500">Last 5</span>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No transactions yet</p>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-extrabold ${txColor(tx.type)}`}>
                  {txSign(tx.type)}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
