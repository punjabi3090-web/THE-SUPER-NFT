import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import {
  DollarSign, Sparkles, RefreshCw, ArrowDownLeft, ArrowUpRight,
  Clock, TrendingUp, MoreVertical, Bell, Send, Headphones,
} from "lucide-react";

type Profile = { balance: number | null; full_name: string | null; referral_code: string | null };
type Tx      = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function HomeTab() {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [txs, setTxs]           = useState<Tx[]>([]);
  const [loading, setLoading]   = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    if (type === "nft_profit") return <TrendingUp size={14} style={{ color: "#16a34a" }} />;
    if (type === "deposit")    return <ArrowDownLeft size={14} style={{ color: "#1E3A8A" }} />;
    if (type === "withdraw")   return <ArrowUpRight size={14} style={{ color: "#DC2626" }} />;
    return <Clock size={14} className="text-gray-400" />;
  };

  const txColor = (type: string) => {
    if (type === "nft_profit" || type === "deposit") return "#16a34a";
    if (type === "withdraw") return "#DC2626";
    return "#1E3A8A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "#F8F9FA" }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#DC2626 transparent transparent transparent" }} />
      </div>
    );
  }

  const balance = profile?.balance ?? 0;

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4" style={{ background: "#F8F9FA", minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: "#1E3A8A", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
            {profile?.full_name?.split(" ")[0] ?? "User"} 👋
          </h1>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-white transition-colors"
            style={{ color: "#1E3A8A" }}
          >
            <MoreVertical size={22} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-50">
              <button
                onClick={() => { setMenuOpen(false); toast("Notifications — Coming Soon!", { icon: "🔔" }); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{ color: "#1E3A8A" }}
              >
                <Bell size={16} style={{ color: "#DC2626" }} />
                Notifications
              </button>
              <button
                onClick={() => { setMenuOpen(false); window.open("https://t.me/+uE-PlUgGg-wzOWRk", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{ color: "#1E3A8A" }}
              >
                <Send size={16} style={{ color: "#DC2626" }} />
                Telegram
              </button>
              <button
                onClick={() => { setMenuOpen(false); window.open("https://t.me/TigerProtocolGlobal", "_blank"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{ color: "#1E3A8A" }}
              >
                <Headphones size={16} style={{ color: "#DC2626" }} />
                Customer Service
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div
        className="rounded-3xl p-6 mb-4 relative overflow-hidden"
        style={{ background: "#1E3A8A" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 bg-white translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2 opacity-70">
            <DollarSign size={14} className="text-white" />
            <p className="text-xs font-medium text-white">Wallet Balance</p>
          </div>
          <p className="text-5xl font-bold tracking-tight text-white">${balance.toFixed(2)}</p>
          <p className="text-xs text-white opacity-50 mt-1.5">USDT</p>
        </div>
      </div>

      {/* ── Claim Button ── */}
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="w-full flex items-center justify-center gap-2.5 font-bold text-sm rounded-2xl py-4 mb-5 text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: claiming ? "#b91c1c" : "#DC2626" }}
        onMouseEnter={e => !claiming && ((e.target as HTMLElement).style.background = "#b91c1c")}
        onMouseLeave={e => !claiming && ((e.target as HTMLElement).style.background = "#DC2626")}
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
            className="bg-white hover:bg-gray-50 rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-colors active:scale-95 shadow-sm border border-gray-100"
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: "#1E3A8A" }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>Recent Transactions</p>
          <span className="text-xs text-gray-400">Last 5</span>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F8F9FA" }}>
                    {txIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold capitalize" style={{ color: "#1E3A8A" }}>
                      {tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: txColor(tx.type) }}>
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
