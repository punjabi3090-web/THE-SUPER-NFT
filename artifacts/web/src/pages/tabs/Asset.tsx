import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Clock, RefreshCw } from "lucide-react";

type Profile = { balance: number | null; total_earned: number | null; total_withdrawn: number | null };
type Tx      = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function AssetTab() {
  const navigate = useNavigate();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [txs, setTxs]             = useState<Tx[]>([]);
  const [claimedSum, setClaimedSum] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const [{ data: prof }, { data: txData }, { data: claimed }] = await Promise.all([
      supabase.from("profiles").select("balance, total_earned, total_withdrawn").eq("id", user.id).single(),
      supabase.from("transactions").select("id, type, amount, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("transactions").select("amount")
        .eq("user_id", user.id).eq("type", "nft_profit").eq("claimed", true),
    ]);

    setProfile(prof ?? null);
    setTxs((txData ?? []) as Tx[]);
    const sum = (claimed ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    setClaimedSum(sum);
    setLoading(false);
    setRefreshing(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const txIcon = (type: string) => {
    if (type === "nft_profit") return <TrendingUp size={13} className="text-emerald-400" />;
    if (type === "deposit")    return <ArrowDownLeft size={13} className="text-blue-400" />;
    if (type === "withdraw")   return <ArrowUpRight size={13} className="text-red-400" />;
    return <Clock size={13} className="text-slate-400" />;
  };

  const txColor = (type: string) => {
    if (type === "nft_profit" || type === "deposit") return "text-emerald-400";
    if (type === "withdraw") return "text-red-400";
    return "text-slate-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const balance   = profile?.balance ?? 0;
  const earned    = profile?.total_earned ?? 0;
  const withdrawn = profile?.total_withdrawn ?? 0;

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Assets</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your full financial overview</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Balance Card ── */}
      <div
        className="rounded-3xl p-6 mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1 opacity-70">
            <Wallet size={13} />
            <p className="text-xs font-medium">Available Balance</p>
          </div>
          <p className="text-4xl font-extrabold">${balance.toFixed(2)}</p>
          <p className="text-xs opacity-50 mt-1">USDT</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Earned",  value: `$${earned.toFixed(2)}`,    color: "text-emerald-400", Icon: TrendingUp },
          { label: "Total Claimed", value: `$${claimedSum.toFixed(2)}`, color: "text-purple-400",  Icon: Wallet },
          { label: "Withdrawn",     value: `$${withdrawn.toFixed(2)}`,  color: "text-blue-400",    Icon: ArrowUpRight },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-2xl p-3 text-center">
            <s.Icon size={14} className={`${s.color} mx-auto mb-1.5`} />
            <p className={`text-base font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => navigate("/deposit")}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm rounded-2xl py-3.5 transition-colors"
        >
          <ArrowDownLeft size={15} /> Deposit
        </button>
        <button
          onClick={() => navigate("/withdraw")}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm rounded-2xl py-3.5 transition-colors"
        >
          <ArrowUpRight size={15} /> Withdraw
        </button>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Transaction History</p>
          <span className="text-xs text-slate-500">{txs.length} records</span>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No transactions yet</p>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white capitalize truncate">
                      {tx.description ?? tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-extrabold flex-shrink-0 ml-2 ${txColor(tx.type)}`}>
                  {tx.type === "withdraw" ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
