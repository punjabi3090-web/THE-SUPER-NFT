import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Copy, Check, Users, TrendingUp, DollarSign } from "lucide-react";

type Member = {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  referral_code: string | null;
  created_at: string | null;
};

type Earning = {
  id: string;
  from_user_id: string | null;
  level: number;
  amount: number;
  nft_package_name: string | null;
  created_at: string;
  from_email?: string;
};

type TeamData = {
  referralCode: string;
  level1: Member[];
  level2: Member[];
  level3: Member[];
  totalEarnings: number;
  recentEarnings: Earning[];
};

export default function MyTeam() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData]         = useState<TeamData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // 1. Get own profile (my referral_code)
      const { data: prof } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .maybeSingle();

      const myCode = prof?.referral_code ?? '';

      // 2. Level 1 — profiles where referred_by_code = my referral code
      const { data: l1 } = myCode
        ? await supabase
            .from('profiles')
            .select('id, user_id, email, name, referral_code, created_at')
            .eq('referred_by_code', myCode)
        : { data: [] };
      const level1: Member[] = l1 ?? [];

      // 3. Level 2 — profiles where referred_by_code IN level1 referral codes
      let level2: Member[] = [];
      if (level1.length > 0) {
        const l1codes = level1.map(m => m.referral_code).filter(Boolean) as string[];
        if (l1codes.length > 0) {
          const { data: l2 } = await supabase
            .from('profiles')
            .select('id, user_id, email, name, referral_code, created_at')
            .in('referred_by_code', l1codes);
          level2 = l2 ?? [];
        }
      }

      // 4. Level 3 — profiles where referred_by_code IN level2 referral codes
      let level3: Member[] = [];
      if (level2.length > 0) {
        const l2codes = level2.map(m => m.referral_code).filter(Boolean) as string[];
        if (l2codes.length > 0) {
          const { data: l3 } = await supabase
            .from('profiles')
            .select('id, user_id, email, name, referral_code, created_at')
            .in('referred_by_code', l2codes);
          level3 = l3 ?? [];
        }
      }

      // 5. Referral earnings
      const { data: earnRows } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      const earnings: Earning[] = earnRows ?? [];

      const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount ?? 0), 0);

      setData({
        referralCode:  prof?.referral_code ?? '',
        level1,
        level2,
        level3,
        totalEarnings,
        recentEarnings: earnings,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const refLink = `${window.location.origin}/login?ref=${data.referralCode}`;
  const total   = data.level1.length + data.level2.length + data.level3.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      <div className="max-w-md mx-auto px-4 pt-10">

        {/* ── Header ─── */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* ── Referral Code + Link ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <p className="text-xs text-slate-400 mb-1 font-medium">Your Referral Code</p>
          <p className="text-2xl font-extrabold text-purple-400 tracking-widest mb-4">
            {data.referralCode || '—'}
          </p>
          <p className="text-xs text-slate-400 mb-1.5 font-medium">Referral Link</p>
          <div className="flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-2.5">
            <p className="text-xs text-slate-300 font-mono flex-1 truncate">{refLink}</p>
            <button onClick={handleCopy} className="text-purple-400 flex-shrink-0 p-1 hover:text-purple-300">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-400 mt-2 text-center font-medium">✓ Copied!</p>}
        </div>

        {/* ── Total Earnings ─── */}
        <div
          className="rounded-2xl p-5 mb-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' }}
        >
          <div>
            <p className="text-xs opacity-70 mb-1">Total Referral Earnings</p>
            <p className="text-3xl font-extrabold">${data.totalEarnings.toFixed(2)}</p>
            <p className="text-xs opacity-50 mt-0.5">USDT</p>
          </div>
          <TrendingUp size={36} className="opacity-30" />
        </div>

        {/* ── Team Level Tree ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-400" />
            <p className="font-semibold text-sm">Team Overview</p>
            <span className="ml-auto bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {total} total
            </span>
          </div>
          <div className="space-y-3">
            {[
              { level: 1, count: data.level1.length, pct: '10%', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { level: 2, count: data.level2.length, pct: '5%',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
              { level: 3, count: data.level3.length, pct: '2%',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
            ].map(row => (
              <div key={row.level} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${row.bg}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${row.color} bg-slate-700`}>
                    L{row.level}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Level {row.level}</p>
                    <p className="text-xs text-slate-400">Commission: {row.pct}</p>
                  </div>
                </div>
                <p className={`text-xl font-extrabold ${row.color}`}>{row.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Level 1 Member List ─── */}
        {data.level1.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-5 mb-4">
            <p className="font-semibold text-sm mb-3 text-emerald-400">Level 1 — Direct ({data.level1.length})</p>
            <div className="space-y-2">
              {data.level1.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name || m.email || '—'}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <p className="text-xs text-slate-500">{fmtDate(m.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Level 2 Member List ─── */}
        {data.level2.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-5 mb-4">
            <p className="font-semibold text-sm mb-3 text-blue-400">Level 2 ({data.level2.length})</p>
            <div className="space-y-2">
              {data.level2.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name || m.email || '—'}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <p className="text-xs text-slate-500">{fmtDate(m.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Level 3 Member List ─── */}
        {data.level3.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-5 mb-4">
            <p className="font-semibold text-sm mb-3 text-yellow-400">Level 3 ({data.level3.length})</p>
            <div className="space-y-2">
              {data.level3.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name || m.email || '—'}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <p className="text-xs text-slate-500">{fmtDate(m.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Earnings ─── */}
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={15} className="text-purple-400" />
            <p className="font-semibold text-sm">Recent Earnings</p>
          </div>
          {data.recentEarnings.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No earnings yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentEarnings.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white">
                      {e.nft_package_name || 'NFT Purchase'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Level {e.level} · {fmtDate(e.created_at)}
                    </p>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm">+${(e.amount ?? 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-xl font-semibold text-slate-400 text-sm hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}
