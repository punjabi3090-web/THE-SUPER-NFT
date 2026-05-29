import { useLocation } from "wouter";
import { ArrowLeft, Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useBalance } from "../App";
import { getAllUsers } from "../lib/store";

export default function MyTeam() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { user } = useBalance();
  const allUsers = getAllUsers();

  const teamMembers = allUsers.filter(u => u.referredBy === user?.referralCode);

  const totalTeamDeposit = teamMembers.reduce((s, u) => s + (u.totalDeposit || 0), 0);
  const totalTeamBalance = teamMembers.reduce((s, u) => s + (u.walletBalance || 0), 0);

  const refLink = `${window.location.origin}/login?ref=${user?.referralCode || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />

      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation('/my')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#EFF6FF' }}
          >
            <ArrowLeft size={18} style={{ color: '#1E3A8A' }} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">My Team</h1>
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
            {teamMembers.length} Members
          </span>
        </div>

        {/* My Referral Code + Link */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4" style={{ borderLeft: '4px solid #1E3A8A' }}>
          <p className="text-xs text-slate-400 mb-1 font-medium">Your Referral Code</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-black tracking-widest" style={{ color: '#1E3A8A' }}>
              {user?.referralCode || '—'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2 font-medium">Your Invite Link</p>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
            <p className="flex-1 text-xs text-slate-600 font-mono truncate">{refLink}</p>
            <button onClick={copyLink} style={{ color: '#1E3A8A' }} className="flex-shrink-0">
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-600 font-medium mt-1.5">✅ Link copied!</p>}
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total Members', value: teamMembers.length.toString(), color: 'text-blue-600', bg: '#EFF6FF', icon: '👥' },
            { label: 'Team Deposits', value: `$${totalTeamDeposit.toFixed(2)}`, color: 'text-emerald-600', bg: '#F0FDF4', icon: '💰' },
            { label: 'Team Balance', value: `$${totalTeamBalance.toFixed(2)}`, color: 'text-purple-600', bg: '#FAF5FF', icon: '💎' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-lg mb-1">{s.icon}</p>
              <p className={`text-sm font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EFF6FF' }}>
              <Users size={32} style={{ color: '#BFDBFE' }} />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No team members yet</p>
            <p className="text-xs text-slate-400 mb-4">Share your referral link to grow your team</p>
            <button
              onClick={copyLink}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: '#1E3A8A' }}
            >
              📋 Copy Invite Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-1">
              Direct Referrals ({teamMembers.length})
            </p>
            {teamMembers.map((m, idx) => (
              <div key={m.userId} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#1E3A8A,#7C3AED)' }}
                >
                  {(m.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Joined {new Date(m.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">${m.walletBalance.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Balance</p>
                  <p className="text-xs font-semibold" style={{ color: '#1E3A8A' }}>Lv {m.level}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
