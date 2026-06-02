import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });
  const [referralCode, setReferralCode] = useState("");

  const [fullName, setFullName]           = useState("");
  const [username, setUsername]           = useState("");
  const [email, setEmail]                 = useState("");
  const [phone, setPhone]                 = useState("");
  const [countryCode, setCountryCode]     = useState("+92");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim())     { showMsg("Full Name is required"); return; }
    if (!username.trim())     { showMsg("Username is required"); return; }
    if (!email.trim())        { showMsg("Email is required"); return; }
    if (!phone.trim())        { showMsg("Phone number is required"); return; }
    if (password.length < 6)  { showMsg("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { showMsg("Passwords do not match"); return; }
    if (!termsAccepted)       { showMsg("Please accept Terms & Conditions"); return; }

    setLoading(true);
    try {
      const ref = localStorage.getItem('referral_code') || referralCode || undefined;

      const { data, error } = await supabase.auth.signUp({
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

      if (error) { showMsg(error.message); return; }

      if (data.user) {
        await supabase.from('users').upsert({
          id:             data.user.id,
          email:          email.trim(),
          username:       username.trim().toLowerCase(),
          wallet_balance: 0,
          total_income:   0,
          referred_by:    ref ?? null,
        });
      }

      if (ref) localStorage.removeItem('referral_code');

      showMsg("Account created! Please login.", "success");
      setTimeout(() => { window.location.replace('/login'); }, 1500);

    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
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

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="text" placeholder="Full Name" value={fullName}
            onChange={e => setFullName(e.target.value)} className={inp} autoFocus />

          <input type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} className={inp} />

          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} className={inp} />

          <div style={{ display: 'flex', gap: 6 }}>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              style={{ width: 96, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 6px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 12 }}>
              {countries.map(c => <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} />
          </div>

          <div style={{ position: 'relative' }}>
            <input type={showPw ? "text" : "password"} placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} className={inp} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input type={showCpw ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} className={inp} />
            <button type="button" onClick={() => setShowCpw(!showCpw)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 2 }}>
            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
              style={{ marginTop: 3, accentColor: '#6b21a8' }} />
            <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
              I agree to the{" "}
              <span style={{ color: '#6b21a8', fontWeight: 600 }}>Terms & Conditions</span>
            </span>
          </label>

          <button type="submit" disabled={loading} className={btn} style={{ ...purpleGrad, marginTop: 4 }}>
            {loading ? "Creating Account..." : "Register"}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: '#6b21a8', fontWeight: 700 }}>Login →</a>
          </p>
        </form>
      </div>
    </div>
  );
}
