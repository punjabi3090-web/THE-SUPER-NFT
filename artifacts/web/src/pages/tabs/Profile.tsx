import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  LogOut, Shield, Users, ShoppingBag, Copy, Check,
  Mail, Phone, Globe, Hash, Calendar
} from "lucide-react";

type Profile = {
  full_name: string | null; email: string | null; phone: string | null;
  country: string | null; referral_code: string | null; role: string | null;
  level: number | null; created_at: string | null;
};

export default function ProfileTab() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, country, referral_code, role, level, created_at")
        .eq("id", user.id).single();
      setProfile(data ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const handleCopy = () => {
    const link = profile?.referral_code
      ? `${window.location.origin}/login?ref=${profile.referral_code}` : "";
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name || email?.split("@")[0] || "User";
  const initial     = displayName[0].toUpperCase();
  const isAdmin     = profile?.role === "admin";

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-4">
      <h1 className="text-2xl font-extrabold text-white mb-6">Profile</h1>

      {/* ── Avatar + Name ── */}
      <div className="bg-slate-800 rounded-3xl p-6 flex items-center gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6b21a8, #4f46e5)" }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-white truncate">{displayName}</p>
          <p className="text-xs text-slate-400 truncate">{email ?? "—"}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] bg-purple-700/40 text-purple-300 border border-purple-600/30 px-2 py-0.5 rounded-full font-semibold">
              Level {profile?.level ?? 1}
            </span>
            {isAdmin && (
              <span className="text-[10px] bg-amber-700/40 text-amber-300 border border-amber-600/30 px-2 py-0.5 rounded-full font-semibold">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Info Rows ── */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Details</p>
        <div className="divide-y divide-slate-700/60">
          {[
            { Icon: Mail,     label: "Email",         value: email },
            { Icon: Hash,     label: "Referral Code", value: profile?.referral_code },
            { Icon: Phone,    label: "Phone",         value: profile?.phone },
            { Icon: Globe,    label: "Country",       value: profile?.country },
            { Icon: Calendar, label: "Member Since",  value: profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : null },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <row.Icon size={13} />
                <p className="text-xs">{row.label}</p>
              </div>
              <p className="text-xs font-medium text-white text-right truncate max-w-[55%]">
                {row.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Referral Link ── */}
      {profile?.referral_code && (
        <div className="bg-slate-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-purple-400" />
            <p className="text-sm font-semibold text-white">My Referral Link</p>
          </div>
          <div className="bg-slate-700/60 rounded-xl px-3 py-3 flex items-center gap-2">
            <p className="text-xs text-slate-300 font-mono flex-1 truncate">
              {`${window.location.origin}/login?ref=${profile.referral_code}`}
            </p>
            <button onClick={handleCopy} className="text-purple-400 hover:text-purple-300 p-1 flex-shrink-0">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-400 mt-2 text-center font-medium">✓ Copied!</p>}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/team")}
          className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl px-5 py-4 transition-colors"
        >
          <Users size={18} className="text-purple-400" />
          <span className="text-sm font-semibold">My Team</span>
        </button>

        <button
          onClick={() => navigate("/nft")}
          className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl px-5 py-4 transition-colors"
        >
          <ShoppingBag size={18} className="text-blue-400" />
          <span className="text-sm font-semibold">NFT Collections</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-3 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 text-white rounded-2xl px-5 py-4 transition-colors"
          >
            <Shield size={18} className="text-purple-400" />
            <span className="text-sm font-semibold">Admin Panel</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-red-900/30 hover:bg-red-900/50 border border-red-700/30 text-red-400 rounded-2xl px-5 py-4 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
}
