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
// IHTIYAT: LOAD TRANSACTION HISTORY - LINE 58
const loadTransactionHistory = async () => {
  if (!user) return;
  
  const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .in('type', ['deposit', 'bonus', 'withdraw'])
  .order('created_at', { ascending: false });

  if (!error && data) {
    const historyData = data.map(t => ({
    ...t,
      history_type: t.type,
      amount: Number(t.amount)
    }));
    setAllHistory(historyData);
    console.log('IHTIYAT: Asset History:', historyData);
  }
  setLoading(false);
};
// ===== REAL-TIME UPDATES START =====
// IHTIYAT: REALTIME - LINE 59
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
   .channel('asset-history')
   .on('postgres_changes', { 
      event: '*', // IHTIYAT: INSERT + UPDATE dono
      schema: 'public', 
      table: 'transactions',
      filter: `user_id=eq.${user.id}`
    }, () => {
      loadTransactionHistory(); // IHTIYAT: Status change pe reload
    })
   .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
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

      {/* === IHTIYAT: NEW TRANSACTION HISTORY WITH COLORS === */}
<div className="mt-4">
  <div className="flex justify-between items-center mb-3 px-1">
    <p className="text-sm font-bold" style={{ color: B }}>Transaction History</p>
    <p className="text-xs text-gray-500">{allHistory?.length || 0} records</p>
  </div>

  {loading? (
    <div className="text-center py-6">
      <p className="text-xs text-gray-400">Loading...</p>
    </div>
  ) :!allHistory || allHistory.length === 0? (
    <div className="text-center py-6">
      <p className="text-xs text-gray-400">No transactions yet</p>
      <p className="text-xs text-gray-300 mt-1">Your deposits and withdrawals will show here</p>
    </div>
  ) : (
    <div className="space-y-2">
      {allHistory.map((item, index) => {
        // IHTIYAT: COLOR LOGIC - TERE COLORS
        const isGreen = 
          (item.history_type === 'deposit' && item.status === 'completed') || // Deposited
          (item.history_type === 'withdraw' && item.status === 'completed') || // Withdrawal Approved
          (item.history_type === 'bonus' && item.status === 'completed');     // Referral bonus
        
        const isRed = 
          (item.history_type === 'withdraw' && item.status === 'pending') ||   // Withdrawal pending
          (item.history_type === 'withdraw' && item.status === 'rejected');    // withdrawal rejected
        
        const bgColor = isGreen ? 'bg-green-50 border-green-200' : 
                       isRed ? 'bg-red-50 border-red-200' : 
                       'bg-blue-50 border-blue-200';
        
        const textColor = isGreen ? 'text-green-700' : 
                         isRed ? 'text-red-700' : 
                         'text-blue-700';
        
        const amountColor = isGreen ? 'text-green-600' : 
                           isRed ? 'text-red-600' : 
                           'text-blue-600';
        
        const iconBg = isGreen ? 'bg-green-100' : 
                      isRed ? 'bg-red-100' : 
                      'bg-blue-100';
        
        const iconText = isGreen ? 'text-green-600' : 
                        isRed ? 'text-red-600' : 
                        'text-blue-600';
        
        const iconLetter = item.history_type === 'bonus' ? 'B' : 
                          item.history_type === 'deposit' ? 'D' : 'W';
        
        const title = item.history_type === 'bonus' ? 'Referral Bonus' :
                     item.history_type === 'deposit' ? 'Deposit' :
                     `Withdraw - ${item.status}`;
        
        const sign = item.history_type === 'withdraw' ? '-' : '+';

        return (
          <div key={item.id || index}>
            <div className={`flex justify-between items-center p-3 rounded-lg border ${bgColor}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center`}>
                  <span className={`${iconText} text-xs font-bold`}>{iconLetter}</span>
                </div>
                <div>
                  <p className={`font-bold ${textColor} text-sm`}>{title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className={`font-bold ${amountColor} text-sm`}>
                {sign}${Number(item.amount).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
{/* === END HISTORY === */}
    </div>
    );
}