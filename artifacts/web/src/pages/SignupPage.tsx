import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type PopupType = { show: boolean; message: string; type: string };

function Popup({ popup }: { popup: PopupType }) {
  if (!popup.show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className={`px-6 py-4 rounded-lg shadow-2xl border-2 text-center ${
        popup.type === "success" ? "bg-white border-emerald-400 text-slate-900" : "bg-red-50 border-red-500 text-red-900"
      }`}>
        <p className="font-semibold text-base">{popup.message}</p>
      </div>
    </div>
  );
}

const countries = [
  { code: "+1",   name: "USA",          flag: "🇺🇸" },
  { code: "+44",  name: "UK",           flag: "🇬🇧" },
  { code: "+92",  name: "Pakistan",     flag: "🇵🇰" },
  { code: "+91",  name: "India",        flag: "🇮🇳" },
  { code: "+86",  name: "China",        flag: "🇨🇳" },
  { code: "+971", name: "UAE",          flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+81",  name: "Japan",        flag: "🇯🇵" },
  { code: "+49",  name: "Germany",      flag: "🇩🇪" },
  { code: "+33",  name: "France",       flag: "🇫🇷" },
  { code: "+55",  name: "Brazil",       flag: "🇧🇷" },
  { code: "+7",   name: "Russia",       flag: "🇷🇺" },
  { code: "+234", name: "Nigeria",      flag: "🇳🇬" },
  { code: "+62",  name: "Indonesia",    flag: "🇮🇩" },
  { code: "+63",  name: "Philippines",  flag: "🇵🇭" },
  { code: "+84",  name: "Vietnam",      flag: "🇻🇳" },
  { code: "+66",  name: "Thailand",     flag: "🇹🇭" },
  { code: "+60",  name: "Malaysia",     flag: "🇲🇾" },
  { code: "+20",  name: "Egypt",        flag: "🇪🇬" },
  { code: "+90",  name: "Turkey",       flag: "🇹🇷" },
  { code: "+27",  name: "South Africa", flag: "🇿🇦" },
  { code: "+880", name: "Bangladesh",   flag: "🇧🇩" },
  { code: "+98",  name: "Iran",         flag: "🇮🇷" },
  { code: "+82",  name: "South Korea",  flag: "🇰🇷" },
  { code: "+54",  name: "Argentina",    flag: "🇦🇷" },
  { code: "+48",  name: "Poland",       flag: "🇵🇱" },
  { code: "+31",  name: "Netherlands",  flag: "🇳🇱" },
  { code: "+39",  name: "Italy",        flag: "🇮🇹" },
  { code: "+34",  name: "Spain",        flag: "🇪🇸" },
  { code: "+380", name: "Ukraine",      flag: "🇺🇦" },
];

export default function SignupPage() {
  const [loading, setLoading]             = useState(false);
  const [showOtp, setShowOtp]             = useState(false);
  const [showPw, setShowPw]               = useState(false);
  const [showCpw, setShowCpw]             = useState(false);
  const [popup, setPopup]                 = useState<PopupType>({ show: false, message: "", type: "" });
  const [referralCode, setReferralCode]   = useState("");

  const [fullName, setFullName]                   = useState("");
  const [username, setUsername]                   = useState("");
  const [email, setEmail]                         = useState("");
  const [otp, setOtp]                             = useState("");
  const [phone, setPhone]                         = useState("");
  const [countryCode, setCountryCode]             = useState("+92");
  const [password, setPassword]                   = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [termsAccepted, setTermsAccepted]         = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/showcase');
    });
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
      setReferralCode(ref);
    } else {
      const stored = localStorage.getItem('referral_code');
      if (stored) setReferralCode(stored);
    }
  }, []);

  const showMsg = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3500);
  };

  const inp = "w-full bg-white/90 text-[#1E293B] px-3 py-2.5 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";
  const btn = "w-full py-2.5 rounded-lg font-bold text-white text-sm shadow-lg disabled:opacity-50";
  const purpleGrad = { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' };

  // ── Step 1: validate + signUp → triggers OTP email ────────────────────────
  const handleSendOtp = async () => {
    if (!fullName.trim())               { showMsg("Full Name is required"); return; }
    if (!username.trim())               { showMsg("Username is required"); return; }
    if (!email.trim())                  { showMsg("Email is required"); return; }
    if (!phone.trim())                  { showMsg("Phone number is required"); return; }
    if (password.length < 6)            { showMsg("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword)   { showMsg("Passwords do not match"); return; }
    if (!termsAccepted)                 { showMsg("Please accept Terms & Conditions"); return; }

    setLoading(true);
    try {
      const ref = localStorage.getItem('referral_code') || referralCode || undefined;
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name:    fullName.trim(),
            username:     username.trim().toLowerCase(),
            phone:        `${countryCode}${phone}`,
            country_code: countryCode,
            referred_by:  ref,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          showMsg("Email already exists. Please login.");
        } else {
          showMsg(error.message);
        }
        return;
      }

      setShowOtp(true);
      showMsg(`6-digit code sent to ${email.trim()}`, "success");

    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP → account confirmed → redirect /login ─────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) { showMsg("Enter the 6-digit code"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'signup',
      });

      if (error) { showMsg("Wrong code: " + error.message); return; }

      const ref = localStorage.getItem('referral_code') || referralCode || null;
      if (ref) localStorage.removeItem('referral_code');

      showMsg("Account created successfully!", "success");
      setTimeout(() => { window.location.replace('/login'); }, 1500);

    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = showOtp;

  return (
    <div
      className="min-h-screen flex items-center justify-center py-6"
      style={{
        backgroundImage: 'url(/images/nft-bg.jpg)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0f0a1e',
      }}
    >
      <style>{`@media(max-width:768px){.signup-card{max-width:360px!important;padding:24px 18px!important;}}`}</style>
      <Popup popup={popup} />

      <div
        className="signup-card"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          boxShadow: '0 8px 48px rgba(80,20,120,0.25)',
          width: '90vw',
          maxWidth: 420,
          padding: '32px 28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/images/logo.png" alt="Logo"
            style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 10px', display: 'block', objectFit: 'cover' }} />
          <p style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', letterSpacing: 0.5 }}>Create Account</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Join THE SUPER NFT</p>
        </div>

        {referralCode && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>🎁 Referred by: <strong>{referralCode}</strong></p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: disabled ? 0.55 : 1, transition: 'opacity 0.2s' }}>
          <input type="text" placeholder="Full Name" value={fullName}
            onChange={e => setFullName(e.target.value)} className={inp} disabled={disabled} autoFocus={!disabled} />

          <input type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} className={inp} disabled={disabled} />

          {/* Email + Send button */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} disabled={disabled}
              style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} />
            {!showOtp && (
              <button type="button" onClick={handleSendOtp} disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #6b21a8, #4f46e5)',
                  color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
                }}>
                {loading ? '...' : 'Send'}
              </button>
            )}
          </div>

          {/* Phone + Country */}
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)} disabled={disabled}
              style={{ width: 96, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 6px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 12 }}>
              {countries.map(c => <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={e => setPhone(e.target.value)} disabled={disabled}
              style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <input type={showPw ? "text" : "password"} placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} className={inp} disabled={disabled} />
            <button type="button" onClick={() => setShowPw(!showPw)} disabled={disabled}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div style={{ position: 'relative' }}>
            <input type={showCpw ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} className={inp} disabled={disabled} />
            <button type="button" onClick={() => setShowCpw(!showCpw)} disabled={disabled}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
              disabled={disabled} style={{ marginTop: 3, accentColor: '#6b21a8' }} />
            <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
              I agree to the <span style={{ color: '#6b21a8', fontWeight: 600 }}>Terms & Conditions</span>
            </span>
          </label>
        </div>

        {/* ── OTP Verification Section ── */}
        {showOtp && (
          <div style={{ marginTop: 14, background: '#f0f9ff', borderRadius: 12, padding: '14px 16px', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: '#0c4a6e', fontWeight: 600 }}>
                Code sent to <strong>{email}</strong>
              </p>
            </div>

            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '2px solid #6b21a8', outline: 'none', fontSize: 20,
                fontWeight: 700, letterSpacing: 10, textAlign: 'center',
                background: '#fff', color: '#1E293B', boxSizing: 'border-box',
                marginBottom: 10,
              }} />

            <button type="button" onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className={btn} style={{ ...purpleGrad, marginBottom: 8 }}>
              {loading ? "Verifying..." : "Verify & Register"}
            </button>

            <button type="button" onClick={() => { setShowOtp(false); setOtp(""); }}
              style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e9d5ff', background: 'transparent', color: '#6b21a8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ← Change Email
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 14 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: '#6b21a8', fontWeight: 700 }}>Login →</a>
        </p>
      </div>
    </div>
  );
}
