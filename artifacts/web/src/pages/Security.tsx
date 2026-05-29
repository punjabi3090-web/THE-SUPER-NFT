import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Key, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { addToHistory } from "../lib/history";

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm max-w-xs text-center"
      style={{ background: '#1E3A8A' }}>
      {msg}
    </div>
  );
}

const TRC20_REGEX = /^T[A-Za-z1-9]{33}$/;
const QRCODE_URL  = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SNFT-GOOGLE-AUTH-SECRET-BASE32";

export default function Security() {
  const [, setLocation] = useLocation();
  const [toast, setToast]   = useState('');

  // Withdrawal address
  const [address, setAddress] = useState(() => localStorage.getItem('withdrawAddress') || '');
  const [addrSaved, setAddrSaved] = useState(!!localStorage.getItem('withdrawAddress'));

  // Google Auth
  const [gaEnabled, setGaEnabled] = useState(() => localStorage.getItem('googleAuthEnabled') === '1');
  const [gaCode, setGaCode]       = useState('');
  const [gaStep, setGaStep]       = useState<'idle' | 'qr' | 'verify'>('idle');

  const showToast = (msg: string) => setToast(msg);

  // ── Address binding ──────────────────────────────────────────────
  const handleSaveAddress = () => {
    if (!TRC20_REGEX.test(address)) {
      showToast('❌ Invalid TRC20 address (must start with T, 34 chars)');
      return;
    }
    localStorage.setItem('withdrawAddress', address);
    setAddrSaved(true);
    addToHistory('security', {
      title: 'Withdrawal Address Bound',
      desc:  `TRC20 address saved: ${address.slice(0, 8)}...${address.slice(-6)}`,
    });
    showToast('✅ Withdrawal address saved!');
  };

  // ── Google Auth ──────────────────────────────────────────────────
  const handleEnableGA = () => setGaStep('qr');

  const handleVerifyGA = () => {
    if (gaCode.length !== 6 || !/^\d{6}$/.test(gaCode)) {
      showToast('❌ Enter a valid 6-digit code');
      return;
    }
    localStorage.setItem('googleAuthEnabled', '1');
    setGaEnabled(true);
    setGaStep('idle');
    setGaCode('');
    addToHistory('security', { title: 'Google Auth Enabled', desc: '2-step verification activated' });
    showToast('✅ Google Authenticator enabled!');
  };

  const handleDisableGA = () => {
    localStorage.setItem('googleAuthEnabled', '0');
    setGaEnabled(false);
    addToHistory('security', { title: 'Google Auth Disabled', desc: '2-step verification deactivated' });
    showToast('Google Auth disabled.');
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-10">
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700"><ArrowLeft size={22} /></button>
        <h1 className="text-lg font-bold text-[#1E293B]">Security</h1>
      </div>

      {/* ── Section 1: Withdrawal Address ──────────────────────────── */}
      <div className="mx-4 mt-5 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} style={{ color: '#1E3A8A' }} />
          <h2 className="font-bold text-[#1E293B]">Withdrawal Address</h2>
          {addrSaved && <CheckCircle size={16} className="text-green-500 ml-auto" />}
        </div>

        <p className="text-xs text-slate-400 mb-3">Bind your TRC20 USDT wallet address for withdrawals.</p>

        <input
          type="text"
          value={address}
          onChange={e => { setAddress(e.target.value); setAddrSaved(false); }}
          placeholder="T... (34 characters, TRC20 format)"
          className="w-full bg-slate-50 border border-[#BFDBFE] focus:border-[#1E3A8A] rounded-xl px-4 py-3 text-sm font-mono text-[#1E293B] outline-none mb-1"
        />
        {address && !TRC20_REGEX.test(address) && (
          <p className="flex items-center gap-1 text-red-500 text-xs mb-2">
            <AlertCircle size={11} /> Must start with T and be exactly 34 characters
          </p>
        )}

        {addrSaved && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-3">
            <CheckCircle size={12} /> Address saved successfully
          </div>
        )}

        <button
          onClick={handleSaveAddress}
          className="w-full py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: '#1E3A8A' }}
        >
          {addrSaved ? 'Update Address' : 'Save Address'}
        </button>
      </div>

      {/* ── Section 2: Google Authenticator ───────────────────────── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key size={20} style={{ color: '#1E3A8A' }} />
          <h2 className="font-bold text-[#1E293B]">Google Authenticator</h2>
          {gaEnabled && <CheckCircle size={16} className="text-green-500 ml-auto" />}
        </div>

        {gaEnabled ? (
          <>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-3">
              <CheckCircle size={14} /> 2-step verification is active
            </div>
            <button
              onClick={handleDisableGA}
              className="w-full py-3 rounded-xl text-white font-bold text-sm bg-red-500"
            >
              Disable Google Auth
            </button>
          </>
        ) : gaStep === 'idle' ? (
          <>
            <p className="text-xs text-slate-400 mb-3">Add an extra layer of security to your account.</p>
            <button
              onClick={handleEnableGA}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: '#1E3A8A' }}
            >
              Enable Google Authenticator
            </button>
          </>
        ) : gaStep === 'qr' ? (
          <>
            <p className="text-xs text-slate-500 mb-3">Scan this QR code with Google Authenticator app:</p>
            <div className="flex justify-center mb-3">
              <img src={QRCODE_URL} alt="QR Code" className="rounded-xl border border-[#BFDBFE]" width={180} height={180} />
            </div>
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-3 py-2 mb-3">
              <p className="text-xs text-[#1E3A8A] font-mono break-all">Secret: SNFT-GOOGLE-AUTH-SECRET-BASE32</p>
            </div>
            <button
              onClick={() => setGaStep('verify')}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: '#1E3A8A' }}
            >
              Next: Verify Code
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">Enter the 6-digit code from your authenticator app:</p>
            <input
              type="tel"
              maxLength={6}
              value={gaCode}
              onChange={e => setGaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-slate-50 border border-[#BFDBFE] focus:border-[#1E3A8A] rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#1E293B] outline-none mb-3"
            />
            <button
              onClick={handleVerifyGA}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: '#1E3A8A' }}
            >
              Verify & Enable
            </button>
            <button
              onClick={() => setGaStep('idle')}
              className="w-full mt-2 py-2 text-sm text-slate-500"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
