import { useState } from "react";
import { ArrowLeft, Shield, MapPin, CheckCircle, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useBalance } from "../App";
import { updateUser, addToUserHistory, getCurrentUserId } from "../lib/store";

export default function Security() {
  const [, setLocation] = useLocation();
  const { user, refresh } = useBalance();
  const [address, setAddress] = useState(user?.withdrawalAddress || "");
  const [addrSaved, setAddrSaved] = useState(false);
  const [addrErr, setAddrErr] = useState("");
  const [gaCode, setGaCode] = useState("");
  const [gaStep, setGaStep] = useState<"idle" | "verify">("idle");
  const [gaErr, setGaErr] = useState("");
  const fakeSecret = "JBSWY3DPEHPK3PXP";
  const uid = getCurrentUserId();

  const handleSaveAddress = () => {
    const t = address.trim();
    if (!t) { setAddrErr("Please enter an address"); return; }
    if (!/^T[A-Za-z1-9]{33}$/.test(t)) { setAddrErr("Invalid TRC20 address (must start with T, 34 chars)"); return; }
    if (!uid) return;
    updateUser(uid, { withdrawalAddress: t, addressBindDate: new Date().toISOString() });
    addToUserHistory(uid, { type: 'security', title: 'Withdrawal Address Bound', desc: `${t.slice(0,10)}...`, date: new Date().toLocaleString(), icon: '🔐', color: '#1E3A8A' });
    refresh();
    setAddrSaved(true); setAddrErr("");
    setTimeout(() => setAddrSaved(false), 3000);
  };

  const handleEnableGA = () => {
    if (gaCode.length !== 6) { setGaErr("Enter 6-digit code"); return; }
    if (!uid) return;
    updateUser(uid, { googleAuthBound: true, googleAuthSecret: fakeSecret });
    addToUserHistory(uid, { type: 'security', title: 'Google Auth Enabled', date: new Date().toLocaleString(), icon: '🔒', color: '#1E3A8A' });
    refresh(); setGaStep("idle"); setGaCode(""); setGaErr("");
  };

  const handleDisableGA = () => {
    if (!uid) return;
    updateUser(uid, { googleAuthBound: false, googleAuthSecret: null });
    addToUserHistory(uid, { type: 'security', title: 'Google Auth Disabled', date: new Date().toLocaleString(), icon: '🔓', color: '#EA4335' });
    refresh();
  };

  const inp = "w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-[#1E3A8A] text-sm";

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 pb-10">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h2 className="font-bold text-lg text-slate-800">Security</h2>
      </div>
      <div className="px-4 py-4 space-y-4">
        {/* Withdrawal Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} style={{ color: '#1E3A8A' }} />
            <p className="font-semibold text-slate-800">Withdrawal Address (TRC20)</p>
          </div>
          {user?.withdrawalAddress && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">Address Bound ✅</p>
                <p className="text-xs text-emerald-600 font-mono break-all mt-0.5">{user.withdrawalAddress}</p>
                {user.addressBindDate && <p className="text-[10px] text-slate-400 mt-1">Bound: {new Date(user.addressBindDate).toLocaleDateString()}</p>}
              </div>
            </div>
          )}
          <input value={address} onChange={e => { setAddress(e.target.value); setAddrErr(""); }} placeholder="Enter TRC20 wallet address (starts with T)" className={inp} />
          {addrErr && <p className="text-red-500 text-xs mt-1">{addrErr}</p>}
          {addrSaved && <p className="text-emerald-600 text-xs mt-1 font-semibold">✅ Address saved!</p>}
          <button onClick={handleSaveAddress} className="w-full mt-3 py-3 rounded-xl text-white font-semibold text-sm" style={{ background: '#1E3A8A' }}>
            {user?.withdrawalAddress ? 'Update Address' : 'Bind Address'}
          </button>
        </div>

        {/* Google Auth */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} style={{ color: '#1E3A8A' }} />
            <p className="font-semibold text-slate-800">Google Authenticator</p>
          </div>
          {user?.googleAuthBound ? (
            <div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">Google Auth Enabled ✅</p>
              </div>
              <button onClick={handleDisableGA} className="w-full py-2.5 rounded-xl text-white font-semibold text-sm bg-red-500">Disable Google Auth</button>
            </div>
          ) : gaStep === "verify" ? (
            <div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Enter this secret in Google Authenticator:</p>
                <div className="w-32 h-32 mx-auto bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center mb-2">
                  <Lock size={40} className="text-slate-300" />
                </div>
                <p className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{fakeSecret}</p>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-2">Enter 6-digit code:</p>
              <input type="text" maxLength={6} value={gaCode} onChange={e => { setGaCode(e.target.value.replace(/\D/g,'')); setGaErr(""); }} placeholder="000000" className={`${inp} text-center text-2xl tracking-widest mb-2`} />
              {gaErr && <p className="text-red-500 text-xs mb-2">{gaErr}</p>}
              <div className="flex gap-2">
                <button onClick={() => setGaStep("idle")} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                <button onClick={handleEnableGA} disabled={gaCode.length !== 6} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ background: '#1E3A8A' }}>Verify & Enable</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-3">Enable 2FA for extra account security.</p>
              <button onClick={() => setGaStep("verify")} className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: '#1E3A8A' }}>Enable Google Auth</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
