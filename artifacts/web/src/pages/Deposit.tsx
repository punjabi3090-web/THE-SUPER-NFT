import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Upload } from "lucide-react";

export default function Deposit() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount]     = useState("");
  const [txHash, setTxHash]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Valid amount enter karo");
      return;
    }
    if (!txHash.trim()) {
      setError("Transaction hash enter karo");
      return;
    }

    setSubmitting(true);
    const { error: dbError } = await supabase.from('deposits').insert({
      user_id: user.id,
      amount: Number(amount),
      tx_hash: txHash.trim(),
      status: 'pending',
    });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    alert("Deposit request submit ho gayi! Admin approval ka wait karo");
    navigate('/');
  };

  const inp = "w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto px-4 pt-10">

        {/* ── Header ─── */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold">Deposit USDT</h1>
        </div>

        {/* ── Form ─── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Amount (USDT)</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inp}
              min="1"
              step="any"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Transaction Hash</label>
            <input
              type="text"
              placeholder="0x... ya TRC20 hash paste karo"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              className={inp}
            />
            <p className="text-xs text-slate-500 mt-1">Apni USDT transfer ki TX ID / Hash yahan paste karo</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' }}
          >
            <Upload size={16} />
            {submitting ? "Submitting..." : "Submit Deposit Request"}
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
