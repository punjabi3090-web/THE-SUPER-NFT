import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  LogOut, Shield, Users, ShoppingBag, Copy, Check, Settings,
  Phone, Globe, Hash, Calendar, ChevronRight, Mail,
  Lock, Wallet, X, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

const R = "#DC2626";
const B = "#1E3A8A";

type Profile = {
  name: string | null; email: string | null; phone: string | null;
  country: string | null; referral_code: string | null; role: string | null;
  level: number | null; created_at: string | null;
};
type BindAddr = { bep20_address: string | null; trc20_address: string | null; bind_at: string | null };

export default function ProfileTab() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [supaUid,  setSupaUid]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState(false);

  const [showSettings,  setShowSettings]  = useState(false);
  const [showSecurity,  setShowSecurity]  = useState(false);

  const [bindAddr,    setBindAddr]    = useState<BindAddr | null>(null);
  const [bep20Input,  setBep20Input]  = useState("");
  const [trc20Input,  setTrc20Input]  = useState("");
  const [savingBind,  setSavingBind]  = useState(false);

  const [totpEnabled,   setTotpEnabled]   = useState(false);
  const [totpSetup,     setTotpSetup]     = useState(false);
  const [totpSecret,    setTotpSecret]    = useState("");
  const [totpQr,        setTotpQr]        = useState("");
  const [totpCode,      setTotpCode]      = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpLoading,   setTotpLoading]   = useState(false);

  useEffect(() => {
    (async () => {
      const [apiUser, { data: { user } }] = await Promise.all([
        getCurrentUser(),
        supabase.auth.getUser(),
      ]);
      if (!apiUser || !user) { navigate("/login", { replace: true }); return; }

      setUserId(String(apiUser.id));
      setSupaUid(user.id);

      const [{ data: bindData }, { data: profData }] = await Promise.all([
        supabase.from("user_withdraw_addresses").select("bep20_address,trc20_address,bind_at").eq("user_id", user.id).single(),
        supabase.from("profiles").select("totp_enabled,referral_code").eq("user_id", user.id).single(),
      ]);

      setProfile({
        name: apiUser.name, email: apiUser.email, phone: apiUser.phone || null,
        country: apiUser.country || null,
        referral_code: (profData?.referral_code as string | null) ?? null,
        role: apiUser.isAdmin ? "admin" : null, level: apiUser.level,
        created_at: apiUser.registeredAt,
      });

      if (bindData) {
        setBindAddr(bindData);
        setBep20Input(bindData.bep20_address ?? "");
        setTrc20Input(bindData.trc20_address ?? "");
      }
      setTotpEnabled(!!profData?.totp_enabled);
      setLoading(false);
    })();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.clear(); sessionStorage.clear();
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

  const saveBindAddr = async () => {
    if (!supaUid) return;
    if (!bep20Input.trim() && !trc20Input.trim()) {
      toast.error("Enter at least one address"); return;
    }
    setSavingBind(true);
    const bindAt = new Date().toISOString();
    const { error } = await supabase.from("user_withdraw_addresses").upsert({
      user_id:       supaUid,
      bep20_address: bep20Input.trim() || null,
      trc20_address: trc20Input.trim() || null,
      bind_at:       bindAt,
    }, { onConflict: "user_id" });
    setSavingBind(false);
    if (error) { toast.error("Save failed: " + error.message); return; }
    setBindAddr({ bep20_address: bep20Input.trim() || null, trc20_address: trc20Input.trim() || null, bind_at: bindAt });
    toast.success("Withdrawal address bound ✓");
  };

  const startTotpSetup = async () => {
    setTotpLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res  = await fetch("/api/2fa/generate", {
        headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json() as { secret?: string; qrCodeDataUrl?: string; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Failed to generate 2FA"); setTotpLoading(false); return; }
      setTotpSecret(data.secret ?? "");
      setTotpQr(data.qrCodeDataUrl ?? "");
      setTotpSetup(true);
    } catch { toast.error("Network error"); }
    setTotpLoading(false);
  };

  const verifyTotp = async () => {
    if (totpCode.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setTotpVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ secret: totpSecret, token: totpCode }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Verification failed"); setTotpVerifying(false); return; }
      setTotpEnabled(true); setTotpSetup(false);
      setTotpCode(""); setTotpSecret(""); setTotpQr("");
      toast.success("Google Authenticator enabled ✓");
    } catch { toast.error("Network error"); }
    setTotpVerifying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: "#F8F9FA" }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${R} transparent transparent transparent` }} />
      </div>
    );
  }

  const displayName = profile?.name || profile?.email?.split("@")[0] || "User";
  const initial     = displayName[0].toUpperCase();
  const isAdmin     = profile?.role === "admin";
  const shortUid    = (userId ?? "").padStart(6, "0").slice(-6);

  const hasBind  = !!(bindAddr && (bindAddr.bep20_address || bindAddr.trc20_address));
  const bindMs   = bindAddr?.bind_at ? Date.now() - new Date(bindAddr.bind_at).getTime() : 0;
  const bindH    = Math.floor(bindMs / 3600000);
  const bindMin  = Math.floor((bindMs % 3600000) / 60000);
  const remH     = Math.max(0, 72 - bindH);
  const unlocked = hasBind && bindH >= 72;

  const inp    = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#1E3A8A] text-gray-800 placeholder-gray-300 font-mono";
  const btnRed = "w-full py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50";

  return (
    <div className="max-w-md mx-auto px-3 pt-3 pb-8" style={{ background: "#F8F9FA", minHeight: "100vh" }}>
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: B, border: "1px solid #e5e7eb" } }} />

      {/* ── Header ── */}
      <div className="flex items-center gap-2 h-14 mb-2">
        <img src="/assets/logo.png" className="h-8 w-auto" alt="Super NFT" />
        <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          THE SUPER NFT
        </h1>
      </div>

      {/* ── Avatar + Name ── */}
      <div className="bg-white rounded-xl p-3 flex items-center gap-3 mb-2 shadow-sm border border-gray-100">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ background: B }}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate leading-tight" style={{ color: B }}>{displayName}</p>
          <p className="text-[10px] text-gray-500 truncate">UID: {shortUid}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border"
              style={{ color: B, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
              Level {profile?.level ?? 0}
            </span>
            {isAdmin && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border"
                style={{ color: R, background: "#FEF2F2", borderColor: "#FECACA" }}>
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Referral Link ── */}
      {profile?.referral_code && (
        <div className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={13} style={{ color: R }} />
            <p className="text-xs font-bold" style={{ color: B }}>My Referral Link</p>
          </div>
          <div className="rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: "#F8F9FA", border: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-mono flex-1 truncate text-gray-500">
              {`${window.location.origin}/login?ref=${profile.referral_code}`}
            </p>
            <button onClick={handleCopy} className="p-1 flex-shrink-0" style={{ color: R }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          {copied && <p className="text-[10px] text-green-600 mt-1 text-center font-medium">✓ Copied!</p>}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="space-y-1.5">
        {[
          { icon: <Users size={15} />,       label: "My Team",           onClick: () => navigate("/team"),          accent: B },
          { icon: <ShoppingBag size={15} />, label: "NFT Collections",   onClick: () => navigate("/nft"),           accent: B },
          { icon: <Lock size={15} />,        label: "Security",           onClick: () => setShowSecurity(true),     accent: B },
          { icon: <Settings size={15} />,    label: "Account Settings",  onClick: () => setShowSettings(true),      accent: B },
          ...(isAdmin ? [{ icon: <Shield size={15} />, label: "Admin Panel", onClick: () => navigate("/admin"), accent: R }] : []),
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick}
            className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-2.5 transition-colors hover:bg-gray-50 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5">
              <span style={{ color: btn.accent }}>{btn.icon}</span>
              <span className="text-xs font-semibold" style={{ color: B }}>{btn.label}</span>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </button>
        ))}

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-colors border font-semibold text-xs"
          style={{ color: R, borderColor: "#FECACA", background: "#FEF2F2" }}>
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* ── Settings Modal (Account Details + Bind + 2FA) ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: B }}>Account Settings</p>
              <button onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Account Details */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Account Details</p>
            <div className="bg-gray-50 rounded-xl p-3 divide-y divide-gray-100 mb-4">
              {[
                { Icon: Mail,     label: "Email",         value: profile?.email },
                { Icon: Hash,     label: "Referral Code", value: profile?.referral_code },
                { Icon: Phone,    label: "Phone",         value: profile?.phone },
                { Icon: Globe,    label: "Country",       value: profile?.country },
                { Icon: Calendar, label: "Member Since",  value: profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })
                    : null },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <row.Icon size={12} />
                    <p className="text-[11px]">{row.label}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-right truncate max-w-[55%]" style={{ color: B }}>
                    {row.value || "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Withdrawal Address Bind */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Withdrawal Address Bind</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              {hasBind && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                    unlocked ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}>
                    {unlocked ? "✓ Unlocked" : `${remH}h left`}
                  </span>
                </div>
              )}
              <div className="space-y-2 mb-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">BEP20 Address (BSC)</label>
                  <input type="text" placeholder="0x..." value={bep20Input}
                    onChange={e => setBep20Input(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">TRC20 Address (TRON)</label>
                  <input type="text" placeholder="T..." value={trc20Input}
                    onChange={e => setTrc20Input(e.target.value)} className={inp} />
                </div>
              </div>
              {hasBind && (
                <div className="rounded-lg px-3 py-2 mb-3 flex items-start gap-2"
                  style={{ background: unlocked ? "#F0FDF4" : "#FEFCE8" }}>
                  <Clock size={11} className="flex-shrink-0 mt-0.5"
                    style={{ color: unlocked ? "#16a34a" : "#CA8A04" }} />
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: unlocked ? "#15803d" : "#92400e" }}>
                      Address bound {bindH}h {bindMin}m ago
                    </p>
                    {!unlocked && (
                      <p className="text-[10px] font-semibold text-yellow-700 mt-0.5">
                        Withdraw unlocks in {remH}h — 72hr security hold
                      </p>
                    )}
                  </div>
                </div>
              )}
              <button onClick={saveBindAddr} disabled={savingBind}
                className={btnRed} style={{ background: R }}>
                {savingBind ? "Saving..." : hasBind ? "Update Address" : "Bind Address"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Security Modal (Google Authenticator) ── */}
      {showSecurity && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowSecurity(false); }}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: B }}>Security</p>
              <button onClick={() => setShowSecurity(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Google Authenticator */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Google Authenticator (2FA)</p>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: totpEnabled ? "#F0FDF4" : "#FFF7ED" }}>
                  <Lock size={14} style={{ color: totpEnabled ? "#16a34a" : "#D97706" }} />
                </div>
                <p className="text-xs font-bold" style={{ color: B }}>Google Authenticator</p>
                {totpEnabled && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-green-50 text-green-700 border border-green-200">✓ Active</span>
                )}
              </div>
              {totpEnabled ? (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "#F0FDF4" }}>
                  <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">2FA is active and protecting your withdrawals</p>
                </div>
              ) : totpSetup ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-1.5 rounded-lg px-3 py-2" style={{ background: "#EFF6FF" }}>
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: B }} />
                    <p className="text-[10px] text-blue-700">Scan this QR code with Google Authenticator, then enter the 6-digit code to activate.</p>
                  </div>
                  {totpQr && (
                    <img src={totpQr} alt="2FA QR Code"
                      className="w-40 h-40 mx-auto rounded-xl border border-gray-200 p-1 bg-white" />
                  )}
                  <div className="rounded-lg px-3 py-2 text-center border border-gray-100" style={{ background: "#F8F9FA" }}>
                    <p className="text-[9px] text-gray-400 mb-1">Or enter this key manually</p>
                    <p className="text-[10px] font-mono font-bold tracking-widest break-all" style={{ color: B }}>{totpSecret}</p>
                  </div>
                  <input
                    type="text" inputMode="numeric" placeholder="Enter 6-digit code"
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1E3A8A] text-gray-800 placeholder-gray-300 text-center tracking-widest font-mono"
                    maxLength={6}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setTotpSetup(false); setTotpCode(""); setTotpSecret(""); setTotpQr(""); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-500">Cancel</button>
                    <button onClick={verifyTotp} disabled={totpVerifying || totpCode.length !== 6}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                      style={{ background: R }}>
                      {totpVerifying ? "Verifying..." : "Verify & Enable"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5 rounded-lg px-3 py-2" style={{ background: "#FFF7ED" }}>
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-orange-500" />
                    <p className="text-[10px] text-orange-700">Required for withdrawals. Scan QR with Google Authenticator app.</p>
                  </div>
                  <button onClick={startTotpSetup} disabled={totpLoading}
                    className={btnRed} style={{ background: B }}>
                    {totpLoading ? "Loading..." : "Enable Google Authenticator"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
