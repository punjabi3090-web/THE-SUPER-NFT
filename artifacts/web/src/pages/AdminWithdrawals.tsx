import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Clock, Check, X, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const R = "#DC2626";
const B = "#1E3A8A";
const BG = "#F8F9FA";

type WdTab = "pending" | "approved" | "rejected" | "all";

type WRow = {
  id: string; amount: number; fee: number | null;
  wallet_address: string | null; network: string | null;
  status: string; created_at: string; updated_at: string | null;
  user_id: string; profiles: { email: string | null } | null;
};

function timeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function etaLabel(createdAt: string, processHours: number): string {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = processHours * 3600000 - elapsed;
  if (remaining <= 0) return "Overdue";
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF9C3", color: "#854D0E" },
  approved: { bg: "#DCFCE7", color: "#166534" },
  rejected: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function AdminWithdrawals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole]               = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [tab, setTab]                 = useState<WdTab>("pending");
  const [rows, setRows]               = useState<WRow[]>([]);
  const [loading, setLoading]         = useState(false);
  const [busy, setBusy]               = useState<Record<string, boolean>>({});
  const [processHours, setProcessHours] = useState(24);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("user_id", user.id).single()
      .then(({ data }) => {
        setRole(data?.role ?? null);
        setRoleLoading(false);
        if (data?.role !== "admin") navigate("/", { replace: true });
      });
  }, [user, navigate]);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("admin_settings").select("value").eq("key", "withdraw_process_hours").single()
      .then(({ data }) => {
        const h = parseFloat(data?.value ?? "24");
        setProcessHours(isNaN(h) ? 24 : h);
      });
  }, [role]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("withdrawals")
      .select("id, amount, fee, wallet_address, network, status, created_at, updated_at, user_id, profiles(email)")
      .order("created_at", { ascending: false });
    if (tab !== "all") q = q.eq("status", tab);
    const { data } = await q;
    setRows((data ?? []) as unknown as WRow[]);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (role !== "admin") return;
    load();
  }, [role, load]);

  const setBusyKey = (k: string, v: boolean) => setBusy(p => ({ ...p, [k]: v }));

  async function approve(id: string) {
    setBusyKey(id, true);
    const { error } = await supabase.from("withdrawals").update({ status: "approved" }).eq("id", id);
    setBusyKey(id, false);
    if (error) { toast.error(error.message); return; }
    toast.success("Approved ✓");
    load();
  }

  async function reject(w: WRow) {
    setBusyKey(w.id + "r", true);
    const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", w.id);
    if (!error) await supabase.rpc("increment_balance", { uid: w.user_id, inc: w.amount });
    setBusyKey(w.id + "r", false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected + Refunded ✓");
    load();
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }
  if (role !== "admin") return null;

  const TABS: { id: WdTab; label: string }[] = [
    { id: "pending",  label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "all",      label: "All" },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: BG }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />
      <div className="max-w-3xl mx-auto px-4">

        <div className="flex items-center gap-3 pt-10 pb-6">
          <button onClick={() => navigate("/admin")}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            style={{ color: B }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: B }}>Withdrawal History</h1>
            <p className="text-xs text-gray-400">Process time: {processHours}h · {rows.length} records</p>
          </div>
          <button onClick={load} className="ml-auto p-1.5 rounded-lg hover:bg-white text-gray-400"><RefreshCw size={14} /></button>
        </div>

        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
              style={tab === t.id
                ? { background: B, color: "white" }
                : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10"><RefreshCw size={18} className="animate-spin text-gray-400" /></div>
        )}

        {!loading && rows.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">
            No {tab === "all" ? "" : tab} withdrawals
          </div>
        )}

        <div className="space-y-3">
          {rows.map(w => {
            const isPending = w.status === "pending";
            const st = STATUS_STYLE[w.status] ?? STATUS_STYLE["pending"];
            const eta = isPending ? etaLabel(w.created_at, processHours) : null;

            return (
              <div key={w.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: B }}>{w.profiles?.email ?? "—"}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: st.bg, color: st.color }}>{w.status}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: R }}>${w.amount.toFixed(2)}</p>
                    {w.fee != null && Number(w.fee) > 0 && (
                      <p className="text-xs text-gray-400">
                        Fee: ${Number(w.fee).toFixed(2)} · Net: ${(w.amount - Number(w.fee)).toFixed(2)}
                      </p>
                    )}
                    {w.wallet_address && (
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[240px]">
                        {w.network ? `${w.network}: ` : ""}{w.wallet_address}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] mt-1">
                      <span className="text-gray-400">
                        <Clock size={10} className="inline mr-0.5" />
                        {new Date(w.created_at).toLocaleString()}
                      </span>
                      <span className="font-medium text-gray-600">⏱ {timeSince(w.created_at)}</span>
                      {isPending && eta && (
                        <span className="font-semibold" style={{ color: eta === "Overdue" ? R : "#16a34a" }}>
                          🎯 {eta}
                        </span>
                      )}
                      {!isPending && w.updated_at && (
                        <span className="text-gray-400">
                          Processed: {new Date(w.updated_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button disabled={busy[w.id]} onClick={() => approve(w.id)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                        style={{ background: "#16a34a" }}>
                        <Check size={11} /> Approve
                      </button>
                      <button disabled={busy[w.id + "r"]} onClick={() => reject(w)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                        style={{ background: R }}>
                        <X size={11} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
