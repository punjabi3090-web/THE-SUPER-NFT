import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, TrendingUp, Clock, DollarSign } from "lucide-react";

type NftPackage = {
  id: string;
  name: string;
  price: number;
  daily_profit_percent: number;
  duration_days: number;
};

async function distributeReferralEarnings(
  buyerId: string,
  price: number,
  packageName: string
) {
  // Get buyer's profile to find their referrer
  const { data: buyerProf } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('user_id', buyerId)
    .single();

  const l1Id = buyerProf?.referred_by;
  if (!l1Id) return;

  // Helper: credit a referrer
  const credit = async (referrerId: string, level: number, pct: number) => {
    const amount = parseFloat(((price * pct) / 100).toFixed(4));
    await Promise.all([
      supabase.from('referral_earnings').insert({
        user_id:          referrerId,
        from_user_id:     buyerId,
        level,
        amount,
        nft_package_name: packageName,
      }),
      supabase.rpc('increment_balance', { uid: referrerId, inc: amount }),
    ]);
  };

  // Level 1 — 10%
  await credit(l1Id, 1, 10);

  // Level 2 — 5%
  const { data: l1Prof } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('user_id', l1Id)
    .single();
  const l2Id = l1Prof?.referred_by;
  if (!l2Id) return;
  await credit(l2Id, 2, 5);

  // Level 3 — 2%
  const { data: l2Prof } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('user_id', l2Id)
    .single();
  const l3Id = l2Prof?.referred_by;
  if (!l3Id) return;
  await credit(l3Id, 3, 2);
}

export default function NFT() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages]       = useState<NftPackage[]>([]);
  const [balance, setBalance]         = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [buying, setBuying]           = useState<string | null>(null);

  const fetchData = async (uid: string) => {
    const [pkgRes, profRes] = await Promise.all([
      supabase.from('nft_packages').select('*').order('price'),
      supabase.from('profiles').select('balance').eq('user_id', uid).single(),
    ]);
    setPackages(pkgRes.data ?? []);
    setBalance(profRes.data?.balance ?? 0);
    setDataLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchData(user.id);
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading NFT packages...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleBuy = async (pkg: NftPackage) => {
    if (balance < pkg.price) return;
    setBuying(pkg.id);

    // Insert purchase
    const { error } = await supabase.from('user_nfts').insert({
      user_id:        user.id,
      nft_package_id: pkg.id,
      purchase_price: pkg.price,
    });

    if (error) {
      alert("Purchase failed: " + error.message);
      setBuying(null);
      return;
    }

    // Distribute referral commissions (best-effort, non-blocking)
    distributeReferralEarnings(user.id, pkg.price, pkg.name).catch(() => {});

    alert("NFT Purchased! Daily profit start");
    await fetchData(user.id);
    setBuying(null);
  };

  const dailyReturn = (pkg: NftPackage) =>
    ((pkg.price * pkg.daily_profit_percent) / 100).toFixed(2);

  const totalReturn = (pkg: NftPackage) =>
    ((pkg.price * pkg.daily_profit_percent * pkg.duration_days) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      <div className="max-w-md mx-auto px-4 pt-10">

        {/* ── Header ─── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                THE SUPER NFT
              </h1>
            </div>
          </div>
        </div>

        {/* ── Balance pill ─── */}
        <div className="flex justify-end mb-6">
          <div className="bg-slate-800 rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <DollarSign size={13} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">${balance.toFixed(2)}</span>
            <span className="text-xs text-slate-400">balance</span>
          </div>
        </div>

        {/* ── Packages ─── */}
        {packages.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-3">🖼️</p>
            <p className="text-sm">No NFT packages available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map(pkg => {
              const canBuy    = balance >= pkg.price;
              const isLoading = buying === pkg.id;

              return (
                <div key={pkg.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-white text-base">{pkg.name}</h2>
                      <p className="text-2xl font-extrabold text-purple-400 mt-0.5">
                        ${pkg.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">
                      NFT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-700/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp size={11} className="text-emerald-400" />
                        <p className="text-[10px] text-slate-400">Daily</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-400">{pkg.daily_profit_percent}%</p>
                    </div>
                    <div className="bg-slate-700/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock size={11} className="text-blue-400" />
                        <p className="text-[10px] text-slate-400">Days</p>
                      </div>
                      <p className="text-sm font-bold text-blue-400">{pkg.duration_days}</p>
                    </div>
                    <div className="bg-slate-700/60 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign size={11} className="text-yellow-400" />
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                      <p className="text-sm font-bold text-yellow-400">${totalReturn(pkg)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    Daily profit: <span className="text-emerald-400 font-semibold">${dailyReturn(pkg)} USDT/day</span>
                  </p>

                  <button
                    onClick={() => handleBuy(pkg)}
                    disabled={!canBuy || isLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:cursor-not-allowed"
                    style={
                      canBuy
                        ? { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)', color: '#fff', opacity: isLoading ? 0.7 : 1 }
                        : { background: '#1e293b', color: '#475569', border: '1px solid #334155' }
                    }
                  >
                    {isLoading ? "Processing..." : canBuy ? `Buy for $${pkg.price}` : "Insufficient Balance"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-slate-400 text-sm hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}
