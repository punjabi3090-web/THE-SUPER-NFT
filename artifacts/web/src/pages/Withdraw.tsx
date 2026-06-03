import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, ArrowDownToLine } from "lucide-react";

export default function Withdraw() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance]       = useState<number>(0);
  const [balLoading, setBalLoading] = useState(true);
  const [amount, setAmount]         = useState("");
  const [wallet, setWallet]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setBalance(data?.balance ?? 0);
        setBalLoading(false);
      });
  }, [user]);

  if (authLoading || balLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amt = Number(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) {
      setError("Valid amount enter karo");
      return;
    }
    if (amt > balance) {
      setError("Insufficient balance");
      return;
    }
    if (!wallet.trim()) {
      setError("Wallet address enter karo");
      return;
    }

    setSubmitting(true);
    const { error: dbError } = await supabase.from('withdrawals').insert({
      user_id:        user.id,
      amount:         amt,
      wallet_address: wallet.trim(),
      status:         'pending',
    });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    alert("Withdraw request submitted!");
    navigate('/');
  };

  const inp = "w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto px-4 pt-10">

        {/* ── Header ─── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold">Withdraw USDT</h1>
        </div>

        {/* ── Balance Banner ─── */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' }}
        >
          <div>
            <p className="text-xs opacity-70 mb-1">Available Balance</p>
            <p className="text-3xl font-extrabold">${balance.toFixed(2)}</p>
            <p className="text-xs opacity-50 mt-0.5">USDT</p>
          </div>
          <ArrowDownToLine size={32} className="opacity-30" />
        </div>

        {/* ── Form ─── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Amount (USDT)
            </label>
            <input
              type="number"
              placeholder={`Max $${balance.toFixed(2)}`}
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              className={inp}
              min="1"
              step="any"
            />
            {Number(amount) > balance && (
              <p className="text-red-400 text-xs mt-1">Insufficient balance</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Wallet Address (USDT TRC20 / BEP20)
            </label>
            <input
              type="text"
              placeholder="T... ya 0x... address paste karo"
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              className={inp}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || Number(amount) > balance}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' }}
          >
            <ArrowDownToLine size={16} />
            {submitting ? "Submitting..." : "Submit Withdraw Request"}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-semibold text-slate-400 text-sm hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </form>

      </div>
    </div>
  );
}
