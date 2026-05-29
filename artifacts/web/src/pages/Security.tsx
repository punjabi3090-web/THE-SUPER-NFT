import { useState } from "react";
import { ArrowLeft, Shield, MapPin, CheckCircle, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { updateUserAddress, updateGoogleAuth, getCurrentUserId } from "../lib/api";

export default function Security() {
  const [, setLocation] = useLocation();
  const { user, refresh } = useBalance();
  const [address, setAddress] = useState(user?.withdrawalAddress || "");
  const [addrSaved, setAddrSaved] = useState(false);
  const [addrErr, setAddrErr] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);
  const [gaCode, setGaCode] = useState("");
  const [gaStep, setGaStep] = useState<"idle" | "verify">("idle");
  const [gaErr, setGaErr] = useState("");
  const [gaLoading, setGaLoading] = useState(false);
  const uid = getCurrentUserId();

  const handleSaveAddress = async () => {
    const t = address.trim();
    if (!t) { setAddrErr("Please enter an address"); return; }
    if (!/^T[A-Za-z1-9]{33}$/.test(t)) { setAddrErr("Invalid TRC20 address (must start with T, 34 chars)"); return; }
    if (!uid) return;
    setAddrLoading(true);
    try {
      await updateUserAddress(uid, t);
      refresh();
      setAddrSaved(true); setAddrErr("");
      setTimeout(() => setAddrSaved(false), 3000);
    } catch { setAddrErr("Failed to save. Please try again."); }
    finally { setAddrLoading(false); }
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

  const inp = "w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-sm";

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Security Center</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Withdrawal Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-blue-600" />
            <p className="font-bold text-slate-800">Withdrawal Address</p>
            {user?.withdrawalAddress && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Bound</span>}
          </div>
          {user?.withdrawalAddress && (
            <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-slate-500 font-mono break-all">{user.withdrawalAddress}</p>
            </div>
          )}
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter TRC20 USDT address (starts with T)" className={inp} />
          {addrErr && <p className="text-red-500 text-xs mt-1">{addrErr}</p>}
          {addrSaved && <p className="text-emerald-600 text-xs mt-1 font-semibold">✅ Address saved!</p>}
          <button onClick={handleSaveAddress} disabled={addrLoading} className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50" style={{ background: '#1E3A8A' }}>
            {addrLoading ? "Saving..." : user?.withdrawalAddress ? "Update Address" : "Bind Address"}
          </button>
        </div>

        {/* Google Auth */}
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
                    placeholder="Enter 6-digit code" maxLength={6} className={inp} />
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
