import { useState } from "react";
import { ArrowLeft, Shield, CheckCircle, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { updateUserAddress, updateGoogleAuth, getCurrentUserId } from "../lib/api";

export default function Security() {
  const [, setLocation] = useLocation();
  const { user, refresh } = useBalance();
  const uid = getCurrentUserId();

  // BEP20
  const [bep20, setBep20] = useState(user?.bep20Address || "");
  const [bep20Saved, setBep20Saved] = useState(false);
  const [bep20Err, setBep20Err] = useState("");
  const [bep20Loading, setBep20Loading] = useState(false);

  // TRC20
  const [trc20, setTrc20] = useState(user?.trc20Address || "");
  const [trc20Saved, setTrc20Saved] = useState(false);
  const [trc20Err, setTrc20Err] = useState("");
  const [trc20Loading, setTrc20Loading] = useState(false);

  // GA
  const [gaCode, setGaCode] = useState("");
  const [gaStep, setGaStep] = useState<"idle" | "verify">("idle");
  const [gaErr, setGaErr] = useState("");
  const [gaLoading, setGaLoading] = useState(false);

  const inp = "w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-sm font-mono";

  const handleSaveBep20 = async () => {
    const t = bep20.trim();
    setBep20Err("");
    if (!t) { setBep20Err("Please enter a BEP20 address"); return; }
    if (!/^(0x[a-fA-F0-9]{40}|bnb1[a-zA-Z0-9]{38})$/.test(t)) {
      setBep20Err("Invalid BEP20 address (should start with 0x and be 42 chars)");
      return;
    }
    if (!uid) return;
    setBep20Loading(true);
    try {
      await updateUserAddress(uid, t, "BEP20");
      refresh();
      setBep20Saved(true);
      setTimeout(() => setBep20Saved(false), 3000);
    } catch { setBep20Err("Failed to save. Please try again."); }
    finally { setBep20Loading(false); }
  };

  const handleSaveTrc20 = async () => {
    const t = trc20.trim();
    setTrc20Err("");
    if (!t) { setTrc20Err("Please enter a TRC20 address"); return; }
    if (!/^T[A-Za-z1-9]{33}$/.test(t)) {
      setTrc20Err("Invalid TRC20 address (must start with T, 34 chars)");
      return;
    }
    if (!uid) return;
    setTrc20Loading(true);
    try {
      await updateUserAddress(uid, t, "TRC20");
      refresh();
      setTrc20Saved(true);
      setTimeout(() => setTrc20Saved(false), 3000);
    } catch { setTrc20Err("Failed to save. Please try again."); }
    finally { setTrc20Loading(false); }
  };

  const handleEnableGA = async () => {
    if (gaCode.length !== 6) { setGaErr("Enter 6-digit code"); return; }
    if (!uid) return;
    setGaLoading(true);
    try {
      await updateGoogleAuth(uid, true);
      refresh(); setGaStep("idle"); setGaCode(""); setGaErr("");
    } catch { setGaErr("Failed. Try again."); }
    finally { setGaLoading(false); }
  };

  const handleDisableGA = async () => {
    if (!uid) return;
    setGaLoading(true);
    try {
      await updateGoogleAuth(uid, false);
      refresh();
    } catch { /* ignore */ }
    finally { setGaLoading(false); }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Security Center</h2>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── BEP20 Address ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🟡</span>
            <p className="font-bold text-slate-800">BEP20 Withdrawal Address</p>
            {user?.bep20Address && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Bound</span>}
          </div>
          <p className="text-xs text-slate-400 mb-3">BSC network — starts with 0x</p>
          {user?.bep20Address && (
            <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-slate-500 font-mono break-all">{user.bep20Address}</p>
            </div>
          )}
          <input value={bep20} onChange={e => setBep20(e.target.value)}
            placeholder="0x... (BEP20 wallet address)" className={inp} />
          {bep20Err && <p className="text-red-500 text-xs mt-1">{bep20Err}</p>}
          {bep20Saved && <p className="text-emerald-600 text-xs mt-1 font-semibold">✅ BEP20 address saved!</p>}
          <button onClick={handleSaveBep20} disabled={bep20Loading}
            className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ background: '#1E3A8A' }}>
            {bep20Loading ? "Saving..." : user?.bep20Address ? "Update BEP20 Address" : "Bind BEP20 Address"}
          </button>
        </div>

        {/* ── TRC20 Address ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔴</span>
            <p className="font-bold text-slate-800">TRC20 Withdrawal Address</p>
            {user?.trc20Address && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Bound</span>}
          </div>
          <p className="text-xs text-slate-400 mb-3">TRON network — starts with T, 34 chars</p>
          {user?.trc20Address && (
            <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-slate-500 font-mono break-all">{user.trc20Address}</p>
            </div>
          )}
          <input value={trc20} onChange={e => setTrc20(e.target.value)}
            placeholder="T... (TRC20 USDT address, 34 chars)" className={inp} />
          {trc20Err && <p className="text-red-500 text-xs mt-1">{trc20Err}</p>}
          {trc20Saved && <p className="text-emerald-600 text-xs mt-1 font-semibold">✅ TRC20 address saved!</p>}
          <button onClick={handleSaveTrc20} disabled={trc20Loading}
            className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ background: '#1E3A8A' }}>
            {trc20Loading ? "Saving..." : user?.trc20Address ? "Update TRC20 Address" : "Bind TRC20 Address"}
          </button>
        </div>

        {/* ── Google Auth ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-purple-600" />
            <p className="font-bold text-slate-800">Google Authenticator</p>
            {user?.googleAuthBound && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Active</span>}
          </div>

          {!user?.googleAuthBound ? (
            <>
              {gaStep === "idle" && (
                <button onClick={() => setGaStep("verify")} className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: '#7C3AED' }}>
                  <Lock size={14} className="inline mr-2" />Enable Google Auth
                </button>
              )}
              {gaStep === "verify" && (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-700 mb-1">Demo Secret Key</p>
                    <p className="font-mono font-bold text-purple-900">JBSWY3DPEHPK3PXP</p>
                  </div>
                  <input value={gaCode} onChange={e => setGaCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    placeholder="Enter 6-digit code" maxLength={6}
                    className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-sm" />
                  {gaErr && <p className="text-red-500 text-xs">{gaErr}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setGaStep("idle"); setGaCode(""); setGaErr(""); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                    <button onClick={handleEnableGA} disabled={gaLoading}
                      className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50" style={{ background: '#7C3AED' }}>
                      <CheckCircle size={14} className="inline mr-1" />{gaLoading ? "..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button onClick={handleDisableGA} disabled={gaLoading}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-50">
              {gaLoading ? "..." : "Disable Google Auth"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
