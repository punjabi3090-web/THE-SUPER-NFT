import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { Play, Clock, CheckCircle, XCircle, Shield, RefreshCw } from "lucide-react";

type RunResult = {
  success: boolean;
  processed?: number;
  total_paid?: number;
  skipped?: number;
  errors?: string[];
  timestamp?: string;
  error?: string;
};

type HistoryRow = {
  id: string;
  created_at: string;
  processed: number;
  total_paid: number;
};

export default function CronTest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole]       = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data }) => {
        setRole(data?.role ?? null);
        setRoleLoading(false);
        if (data?.role !== "admin") navigate("/", { replace: true });
      });
  }, [user, navigate]);

  const loadHistory = async () => {
    setHistLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, created_at, amount")
      .eq("type", "nft_profit")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      const grouped: Record<string, { count: number; total: number }> = {};
      for (const row of data) {
        const day = row.created_at.slice(0, 10);
        if (!grouped[day]) grouped[day] = { count: 0, total: 0 };
        grouped[day].count++;
        grouped[day].total += row.amount ?? 0;
      }
      setHistory(
        Object.entries(grouped).map(([day, v], i) => ({
          id: String(i),
          created_at: day,
          processed: v.count,
          total_paid: v.total,
        }))
      );
    }
    setHistLoading(false);
  };

  useEffect(() => {
    if (role === "admin") loadHistory();
  }, [role]);

  const runCron = async () => {
    setRunning(true);
    setLastResult(null);
    const toastId = toast.loading("Running daily profit distribution...");
    try {
      const { data, error } = await supabase.functions.invoke("daily-profit");
      if (error) throw error;
      const result: RunResult = data;
      setLastResult(result);
      if (result.success) {
        toast.success(
          `✓ Processed ${result.processed} NFT(s) · $${result.total_paid?.toFixed(2)} paid`,
          { id: toastId, duration: 5000 }
        );
        loadHistory();
      } else {
        toast.error(result.error ?? "Function returned error", { id: toastId });
      }
    } catch (err: any) {
      const msg = err?.message ?? "Invoke failed";
      setLastResult({ success: false, error: msg });
      toast.error(msg, { id: toastId });
    }
    setRunning(false);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-16">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#fff", border: "1px solid #334155" } }} />

      <div className="max-w-xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Daily Profit Cron</h1>
              <p className="text-xs text-slate-400">Manual trigger + history</p>
            </div>
          </div>
          <button onClick={() => navigate("/admin")} className="text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-xl transition-colors">
            ← Admin
          </button>
        </div>

        {/* ── Cron Info Card ── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-purple-400" />
            <p className="text-sm font-semibold text-white">Supabase Edge Function</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 font-mono text-xs text-slate-300 space-y-1">
            <p><span className="text-slate-500">Function:</span> daily-profit</p>
            <p><span className="text-slate-500">Schedule:</span> 0 0 * * * (00:00 UTC daily)</p>
            <p><span className="text-slate-500">Auth:</span> service_role key</p>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p>• Finds all active user_nfts where end_date &gt; now()</p>
            <p>• Calculates daily_profit = purchase_price × daily_profit_percent / 100</p>
            <p>• Credits each user's balance via increment_balance RPC</p>
            <p>• Inserts a transaction record (type = nft_profit)</p>
            <p>• Marks expired NFTs as completed</p>
          </div>
        </div>

        {/* ── Run Button ── */}
        <button
          onClick={runCron}
          disabled={running}
          className="w-full mb-4 flex items-center justify-center gap-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl py-4 transition-colors"
        >
          {running
            ? <><RefreshCw size={16} className="animate-spin" /> Running...</>
            : <><Play size={16} /> Run Daily Profit Manually</>
          }
        </button>

        {/* ── Last Result ── */}
        {lastResult && (
          <div className={`rounded-2xl p-5 mb-4 ${lastResult.success ? "bg-emerald-900/40 border border-emerald-700" : "bg-red-900/40 border border-red-700"}`}>
            <div className="flex items-center gap-2 mb-3">
              {lastResult.success
                ? <CheckCircle size={16} className="text-emerald-400" />
                : <XCircle size={16} className="text-red-400" />
              }
              <p className="text-sm font-semibold text-white">
                {lastResult.success ? "Completed Successfully" : "Failed"}
              </p>
            </div>
            {lastResult.success ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Processed",  value: lastResult.processed ?? 0 },
                  { label: "Total Paid", value: `$${(lastResult.total_paid ?? 0).toFixed(2)}` },
                  { label: "Skipped",    value: lastResult.skipped ?? 0 },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-white">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-300">{lastResult.error}</p>
            )}
            {lastResult.errors && lastResult.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-yellow-400 font-semibold">Partial errors:</p>
                {lastResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-400 font-mono">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── History ── */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-purple-400" />
              <p className="text-sm font-semibold text-white">Recent Profit History</p>
            </div>
            <button onClick={loadHistory} className="text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={14} className={histLoading ? "animate-spin" : ""} />
            </button>
          </div>
          {histLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No profit transactions yet. Run the cron to start.</p>
          ) : (
            <div className="divide-y divide-slate-700">
              {history.map(row => (
                <div key={row.id} className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{row.created_at}</p>
                    <p className="text-xs text-slate-400">{row.processed} NFT{row.processed !== 1 ? "s" : ""} processed</p>
                  </div>
                  <p className="text-sm font-extrabold text-emerald-400">+${row.total_paid.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
