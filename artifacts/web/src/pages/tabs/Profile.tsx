import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  LogOut, Shield, Users, ShoppingBag, Copy, Check,
  Mail, Phone, Globe, Hash, Calendar, ChevronRight,
} from "lucide-react";

type Profile = {
  full_name: string | null; email: string | null; phone: string | null;
  country: string | null; referral_code: string | null; role: string | null;
  level: number | null; created_at: string | null;
};

export default function ProfileTab() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email,   setEmail]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }
      setEmail(user.email ?? null);
      const { data } = await supabase.from("profiles")
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
    const link = profile?.referral_code ? `${window.location.origin}/login?ref=${profile.referral_code}` : "";
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "#F8F9FA" }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#DC2626 transparent transparent transparent" }} />
      </div>
    );
  }

  const displayName = profile?.full_name || email?.split("@")[0] || "User";
  const initial     = displayName[0].toUpperCase();
  const isAdmin     = profile?.role === "admin";

  return (
    <div className="max-w-md mx-auto px-3 pt-3 pb-2" style={{ background: "#F8F9FA", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 h-14 mb-2">
        <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
        <h1 className="text-base font-bold" style={{ color: "#1E3A8A" }}>Profile</h1>
      </div>

      {/* ── Avatar + Name ── */}
      <div className="bg-white rounded-xl p-3 flex items-center gap-3 mb-2 shadow-sm border border-gray-100">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ background: "#1E3A8A" }}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate leading-tight" style={{ color: "#1E3A8A" }}>{displayName}</p>
          <p className="text-[10px] text-gray-500 truncate">{email ?? "—"}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border"
              style={{ color: "#1E3A8A", background: "#EFF6FF", borderColor: "#BFDBFE" }}>
              Level {profile?.level ?? 1}
            </span>
            {isAdmin && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border"
                style={{ color: "#DC2626", background: "#FEF2F2", borderColor: "#FECACA" }}>
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Info Rows ── */}
      <div className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Account Details</p>
        <div className="divide-y divide-gray-100">
          {[
            { Icon: Mail,     label: "Email",         value: email },
            { Icon: Hash,     label: "Referral Code", value: profile?.referral_code },
            { Icon: Phone,    label: "Phone",         value: profile?.phone },
            { Icon: Globe,    label: "Country",       value: profile?.country },
            { Icon: Calendar, label: "Member Since",  value: profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : null },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1.5 gap-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <row.Icon size={12} />
                <p className="text-[11px]">{row.label}</p>
              </div>
              <p className="text-[11px] font-semibold text-right truncate max-w-[55%]" style={{ color: "#1E3A8A" }}>
                {row.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Referral Link ── */}
      {profile?.referral_code && (
        <div className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={13} style={{ color: "#DC2626" }} />
            <p className="text-xs font-bold" style={{ color: "#1E3A8A" }}>My Referral Link</p>
          </div>
          <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "#F8F9FA", border: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-mono flex-1 truncate text-gray-500">
              {`${window.location.origin}/login?ref=${profile.referral_code}`}
            </p>
            <button onClick={handleCopy} className="p-1 flex-shrink-0" style={{ color: "#DC2626" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          {copied && <p className="text-[10px] text-green-600 mt-1 text-center font-medium">✓ Copied!</p>}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="space-y-1.5">
        {[
          { icon: <Users size={15} />,       label: "My Team",          onClick: () => navigate("/team"),  accent: "#1E3A8A" },
          { icon: <ShoppingBag size={15} />, label: "NFT Collections",  onClick: () => navigate("/nft"),   accent: "#1E3A8A" },
          ...(isAdmin ? [{ icon: <Shield size={15} />, label: "Admin Panel", onClick: () => navigate("/admin"), accent: "#DC2626" }] : []),
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick}
            className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-2.5 transition-colors hover:bg-gray-50 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5">
              <span style={{ color: btn.accent }}>{btn.icon}</span>
              <span className="text-xs font-semibold" style={{ color: "#1E3A8A" }}>{btn.label}</span>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>
        ))}

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-colors border font-semibold text-xs"
          style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );
}
