import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Clock, RefreshCw } from "lucide-react";

type Profile = { balance: number | null; total_earned: number | null; total_withdrawn: number | null };
type Tx      = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function AssetTab() {
  const navigate = useNavigate();
  const [profile,    setProfile]   = useState<Profile | null>(null);
  const [txs,        setTxs]       = useState<Tx[]>([]);
  const [claimedSum, setClaimedSum] = useState(0);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const [{ data: prof }, { data: txData }, { data: claimed }] = await Promise.all([
      supabase.from("profiles").select("balance, total_earned, total_withdrawn").eq("user_id", user.id).single(),
      supabase.from("transactions").select("id, type, amount, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "nft_profit").eq("claimed", true),
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
    if (type === "nft_profit") return <TrendingUp size={12} style={{ color: "#16a34a" }} />;
    if (type === "deposit")    return <ArrowDownLeft size={12} style={{ color: "#1E3A8A" }} />;
    if (type === "withdraw")   return <ArrowUpRight size={12} style={{ color: "#DC2626" }} />;
    return <Clock size={12} className="text-gray-400" />;
  };

  const txColor = (type: string) => {
    if (type === "nft_profit" || type === "deposit") return "#16a34a";
    if (type === "withdraw") return "#DC2626";
    return "#1E3A8A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "#F8F9FA" }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#DC2626 transparent transparent transparent" }} />
      </div>
    );
  }

  const balance   = profile?.balance ?? 0;
  const earned    = profile?.total_earned ?? 0;
  const withdrawn = profile?.total_withdrawn ?? 0;

  return (
    <div className="max-w-md mx-auto px-3 pt-3 pb-2" style={{ background: "#F8F9FA", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between h-14 mb-2">
        <div className="flex items-center gap-2">
          <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
          <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            THE SUPER NFT
          </h1>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="p-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50" style={{ color: "#1E3A8A" }}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Balance Card ── */}
      <div className="rounded-2xl p-3 mb-2 relative overflow-hidden" style={{ background: "#1E3A8A" }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white -translate-y-6 translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-0.5 opacity-70">
            <Wallet size={12} className="text-white" />
            <p className="text-[10px] font-medium text-white">Available Balance</p>
          </div>
          <p className="text-2xl font-bold text-white leading-tight">${balance.toFixed(2)}</p>
          <p className="text-[10px] text-white opacity-50 mt-0.5">USDT</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[
          { label: "Total Earned",  value: `$${earned.toFixed(2)}`,     color: "#16a34a", bg: "#F0FDF4", Icon: TrendingUp },
          { label: "Total Claimed", value: `$${claimedSum.toFixed(2)}`, color: "#DC2626", bg: "#FEF2F2", Icon: Wallet },
          { label: "Withdrawn",     value: `$${withdrawn.toFixed(2)}`,  color: "#1E3A8A", bg: "#EFF6FF", Icon: ArrowUpRight },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2 text-center border border-gray-100 bg-white shadow-sm">
            <s.Icon size={13} style={{ color: s.color }} className="mx-auto mb-1" />
            <p className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={() => navigate("/deposit")}
          className="flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl h-9 transition-colors active:scale-95"
          style={{ background: "#DC2626" }}>
          <ArrowDownLeft size={13} /> Deposit
        </button>
        <button onClick={() => navigate("/withdraw")}
          className="flex items-center justify-center gap-1.5 font-semibold text-xs rounded-xl h-9 transition-colors active:scale-95 border"
          style={{ color: "#1E3A8A", borderColor: "#1E3A8A", background: "white" }}>
          <ArrowUpRight size={13} /> Withdraw
        </button>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold" style={{ color: "#1E3A8A" }}>Transaction History</p>
          <span className="text-[10px] text-gray-400">{txs.length} records</span>
        </div>
        {txs.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-4">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F8F9FA" }}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold capitalize truncate leading-tight" style={{ color: "#1E3A8A" }}>
                      {tx.description ?? tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: txColor(tx.type) }}>
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
