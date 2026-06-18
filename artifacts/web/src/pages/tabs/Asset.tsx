import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Clock, RefreshCw } from "lucide-react";

const B = "#1E3A8A";

type Profile = { balance: number; total_earned: number; total_withdrawn: number };
type Tx      = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function AssetTab() {
  const navigate = useNavigate();
  const [profile,    setProfile]   = useState<Profile | null>(null);
  const [txs,        setTxs]       = useState<Tx[]>([]);
  const [claimedSum, setClaimedSum] = useState(0);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user,       setUser]       = useState<{ id: string } | null>(null);
  const [allHistory, setAllHistory] = useState<any[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    setUser(user);

    const [apiUser, { data: txData }, { data: claimed }] = await Promise.all([
      getCurrentUser(),
      supabase.from("transactions").select("id, type, amount, description, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "nft_profit").eq("claimed", true),
    ]);

    if (apiUser) {
  const { data: profData } = await supabase.from('profiles')
    .select('balance, total_withdraw')
    .eq('user_id', user.id)
    .single();

  setProfile({
    balance: profData?.balance ?? 0,
    total_earned: apiUser.reserveIncome + apiUser.teamIncome + apiUser.activityIncome,
    total_withdrawn: profData?.total_withdraw ?? 0,
  });
}
  
    setTxs((txData ?? []) as Tx[]);
    const sum = (claimed ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0);
    setClaimedSum(sum);
    setLoading(false);
    setRefreshing(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const loadTransactionHistory = async () => {
    if (!user) return;
    const { data: withdrawals } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: deposits } = await supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: bonuses } = await supabase.from('transactions').select('*').eq('user_id', user.id).in('type', ['referral_bonus', 'signup_bonus']).order('created_at', { ascending: false });

    const combined = [
    ...(withdrawals || []).map(w => ({...w, history_type: 'withdraw' })),
    ...(deposits || []).map(d => ({...d, history_type: 'deposit' })),
    ...(bonuses || []).map(b => ({...b, history_type: b.type === 'referral_bonus'? 'referral' : 'bonus' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setAllHistory(combined);
  };
// ===== REAL-TIME UPDATES START =====
useEffect(() => {
  if (!user) return;
  const channel = supabase.channel('all_transactions_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` }, () => loadTransactionHistory())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits', filter: `user_id=eq.${user.id}` }, () => loadTransactionHistory())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => loadTransactionHistory())
  .subscribe();
  return () => { supabase.removeChannel(channel); };
}, );
// ===== REAL-TIME UPDATES END =====
  useEffect(() => { if (user) { loadTransactionHistory(); } }, [user]);

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

      <div className="mt-4 bg-white rounded-xl p-3 mb-2 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold" style={{color: B}}>Transaction History</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {allHistory.length} records
          </span>
        </div>
        {allHistory.length === 0? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No transactions yet</p>
            <p className="text-gray-300 text-xs mt-1">Your deposits and withdrawals will show here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allHistory.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm capitalize">
                      {item.history_type === 'withdraw' && 'Withdrawal'}
                      {item.history_type === 'deposit' && 'Deposit'}
                      {item.history_type === 'referral' && 'Referral Bonus'}
                      {item.history_type === 'bonus' && 'Signup Bonus'}
                    </p>
                    <p className="text-xs text-gray-500">
                     {new Date(item.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{color: item.history_type === 'deposit' || item.history_type === 'bonus' ? '#22c55e' : item.history_type === 'withdraw' && item.status === 'approved' ? '#22c55e' : '#ef4444'}}> 
                    {item.history_type === 'withdraw'? '-' : '+'}${Number(item.amount || item.usd_amount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs capitalize" style={{color: item.history_type === 'deposit' || item.history_type === 'bonus' ? '#22c55e' : item.status === 'approved' || item.status === 'confirmed' ? '#22c55e' : item.status === 'rejected' || item.status === 'pending' ? '#ef4444' : '#6b7280'}}>
  {item.status === 'approved' ? 'Completed' : item.status === 'confirmed' ? 'Completed' : item.status || 'pending'}
</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
