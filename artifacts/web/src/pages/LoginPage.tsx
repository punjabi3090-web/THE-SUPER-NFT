import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle, Send } from "lucide-react";
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
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
];

type PageState = "register" | "login" | "forgot" | "forgot_otp";

export default function LoginPage() {
  const [page, setPage] = useState<PageState>("register");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    signupOtp: "",
    phone: "",
    countryCode: "+92",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    referralCode: "",
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showNewPw2, setShowNewPw2] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/dashboard');
    });
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
      setForm(f => ({ ...f, referralCode: ref }));
    } else {
      const stored = localStorage.getItem('referral_code');
      if (stored) setForm(f => ({ ...f, referralCode: stored }));
    }
    if (params.get('mode') === 'login') setPage('login');
    if (ref && params.get('mode') !== 'login') setPage('register');
  }, []);

  const showMsg = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3500);
  };

  const inp = "w-full bg-white/90 text-[#1E293B] px-3 py-2.5 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";
  const btn = "w-full py-2.5 rounded-lg font-bold text-white text-sm shadow-lg disabled:opacity-50";
  const purpleGrad = { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' };

  // ── Send OTP to signup email ──────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!form.email.trim()) { showMsg("Please enter your email first"); return; }
    setSendingCode(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: form.email.trim() });
      if (error) { showMsg(error.message); return; }
      setOtpSent(true);
      showMsg("Code sent! Check your email.", "success");
    } catch { showMsg("Failed to send code. Try again."); }
    finally { setSendingCode(false); }
  };

  // ── Register: verifyOtp → updateUser → upsert profile/users ──────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { showMsg("Full name is required"); return; }
    if (!form.username.trim()) { showMsg("Username is required"); return; }
    if (!otpSent) { showMsg("Please send and verify the email code first"); return; }
    if (form.signupOtp.length !== 6) { showMsg("Enter the 6-digit code from your email"); return; }
    if (form.password.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { showMsg("Passwords do not match"); return; }
    if (!form.termsAccepted) { showMsg("Please accept the Terms & Conditions"); return; }

    setLoading(true);
    try {
      // Step 1: Verify OTP (establishes session)
      const { data, error: otpErr } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token: form.signupOtp,
        type: 'email',
      });
      if (otpErr) { showMsg("Invalid or expired code. Click 'Send Code' again."); return; }
      if (!data.user) { showMsg("Verification failed. Please try again."); return; }

      // Step 2: Set password + user metadata
      const { error: updateErr } = await supabase.auth.updateUser({
        password: form.password,
        data: {
          full_name: form.fullName.trim(),
          username: form.username.trim(),
          phone: `${form.countryCode}${form.phone}`,
          country_code: form.countryCode,
          terms_accepted: true,
        },
      });
      if (updateErr) { showMsg(updateErr.message); return; }

      // Step 3: Upsert profile + users tables (trigger may have run with empty metadata)
      const referredBy = localStorage.getItem('referral_code') || form.referralCode || null;
      await Promise.all([
        supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email.trim(),
          full_name: form.fullName.trim(),
          username: form.username.trim(),
          phone: `${form.countryCode}${form.phone}`,
          country_code: form.countryCode,
          terms_accepted: true,
          balance: 0,
          level: 1,
        }),
        supabase.from('users').upsert({
          id: data.user.id,
          email: form.email.trim(),
          username: form.username.trim(),
          wallet_balance: 0,
          total_income: 0,
          referred_by: referredBy,
        }),
      ]);

      if (referredBy) localStorage.removeItem('referral_code');

      showMsg("Account created! Redirecting to login...", "success");
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.replace('/login');
      }, 1500);

    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        showMsg("Invalid email or password");
        return;
      }
      showMsg("Login successful!", "success");
      setTimeout(() => { window.location.replace('/showcase'); }, 800);
    } catch { showMsg("Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Forgot password: send OTP ─────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { showMsg("Please enter your email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: forgotEmail.trim() });
      if (error) { showMsg(error.message); return; }
      showMsg("OTP sent! Check your email.", "success");
      setPage("forgot_otp");
    } catch { showMsg("Failed to send OTP. Try again."); }
    finally { setLoading(false); }
  };

  // ── Forgot password: verify OTP + set new password ───────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) { showMsg("Please enter the 6-digit OTP"); return; }
    if (!forgotNewPass || forgotNewPass.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    if (forgotNewPass !== forgotConfirmPass) { showMsg("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: forgotOtp,
        type: 'email',
      });
      if (otpErr) { showMsg("Incorrect OTP or expired. Try again."); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ password: forgotNewPass });
      if (updateErr) { showMsg(updateErr.message); return; }

      showMsg("Password reset! Please login.", "success");
      setTimeout(() => {
        setPage("login");
        setForm(f => ({ ...f, email: forgotEmail, password: "" }));
        setForgotOtp(""); setForgotNewPass(""); setForgotConfirmPass("");
      }, 2000);
    } catch { showMsg("Reset failed. Please try again."); }
    finally { setLoading(false); }
  };

  const registerReady =
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    otpSent &&
    form.signupOtp.length === 6 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword &&
    form.termsAccepted;

  // ── JSX ──────────────────────────────────────────────────────────────────
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
      <style>{`
        @media (max-width: 768px) {
          .nft-bg-wrap { background-size: cover!important; }
          .nft-form-card { flex-direction: column!important; max-width: 380px!important; }
          .nft-divider { width: 100%!important; height: 1px!important; border-left: none!important; border-top: 1px solid rgba(106,27,154,0.15)!important; }
          .nft-col { width: 100%!important; }
        }
      `}</style>
      <Popup popup={popup} />

      <div
        className="nft-form-card"
        style={{
          display: 'flex',
          flexDirection: 'row',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          boxShadow: '0 8px 48px rgba(80,20,120,0.25)',
          width: '90vw',
          maxWidth: 820,
          minHeight: 500,
          overflow: 'hidden',
          marginTop: '-2vh',
        }}
      >
        {/* ── LEFT: Login / Forgot ── */}
        <div className="nft-col" style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <img src="/images/logo.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 10, margin: '0 auto 8px', display: 'block', objectFit: 'cover' }} />
            <p style={{ fontWeight: 800, fontSize: 15, color: '#1E293B', letterSpacing: 0.5 }}>
              {page === 'forgot' || page === 'forgot_otp' ? 'Reset Password' : 'Login'}
            </p>
          </div>

          {page === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} className={inp} required autoFocus />
              <div style={{ position: 'relative' }}>
                <input type={showPw ? "text" : "password"} placeholder="Password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} className={inp} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button type="button" onClick={() => { setPage("forgot"); setForgotEmail(form.email); }}
                  style={{ fontSize: 11, color: '#6b21a8', fontWeight: 600 }}>Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className={btn} style={purpleGrad}>
                {loading ? "Logging in..." : "Login"}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                No account?{" "}
                <button type="button" onClick={() => setPage("register")} style={{ color: '#6b21a8', fontWeight: 700 }}>
                  Sign Up →
                </button>
              </p>
            </form>
          )}

          {(page === 'register') && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Already have an account?</p>
              <button onClick={() => setPage("login")} className={btn} style={{ ...purpleGrad, padding: '10px 0' }}>
                Go to Login →
              </button>
            </div>
          )}

          {page === 'forgot' && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button type="button" onClick={() => setPage("login")} style={{ color: '#94a3b8' }}><ArrowLeft size={16} /></button>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>Forgot Password</p>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Enter your email to receive OTP</p>
              <input type="email" placeholder="Your email" value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)} className={inp} required autoFocus />
              <button type="submit" disabled={loading || !forgotEmail.trim()} className={btn} style={purpleGrad}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {page === 'forgot_otp' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button type="button" onClick={() => setPage("forgot")} style={{ color: '#94a3b8' }}><ArrowLeft size={16} /></button>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>OTP & New Password</p>
              </div>
              <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                <CheckCircle size={16} style={{ color: '#10b981', margin: '0 auto 4px', display: 'block' }} />
                <p style={{ fontSize: 10, color: '#64748b' }}>OTP sent to <strong>{forgotEmail}</strong></p>
              </div>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={forgotOtp}
                onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={inp + " text-center text-lg font-bold tracking-widest"} autoFocus />
              <div style={{ position: 'relative' }}>
                <input type={showNewPw ? "text" : "password"} placeholder="New Password"
                  value={forgotNewPass} onChange={e => setForgotNewPass(e.target.value)} className={inp} required />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showNewPw2 ? "text" : "password"} placeholder="Confirm New Password"
                  value={forgotConfirmPass} onChange={e => setForgotConfirmPass(e.target.value)} className={inp} required />
                <button type="button" onClick={() => setShowNewPw2(!showNewPw2)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showNewPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={loading || forgotOtp.length !== 6 || !forgotNewPass}
                className={btn} style={purpleGrad}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <div className="nft-divider" style={{ width: 1, borderLeft: '1px solid rgba(106,27,154,0.15)', alignSelf: 'stretch' }} />

        {/* ── RIGHT: Sign Up ── */}
        <div className="nft-col" style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#1E293B', letterSpacing: 0.5 }}>Sign Up</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Join THE SUPER NFT</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

            {form.referralCode && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>🎁 Referred by: <strong>{form.referralCode}</strong></p>
              </div>
            )}

            {/* Full Name */}
            <input type="text" placeholder="Full Name" value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })} className={inp} required />

            {/* Username */}
            <input type="text" placeholder="Username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value.replace(/\s/g, '').toLowerCase() })} className={inp} required />

            {/* Email + Send Code button */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setOtpSent(false); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} required />
              <button type="button" onClick={handleSendCode} disabled={sendingCode || !form.email.trim()}
                style={{
                  background: otpSent ? '#10b981' : 'linear-gradient(135deg, #6b21a8, #4f46e5)',
                  color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: (sendingCode || !form.email.trim()) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                {sendingCode ? '...' : otpSent ? <><CheckCircle size={12} /> Sent</> : <><Send size={12} /> Send Code</>}
              </button>
            </div>

            {/* OTP input — shown after Send Code clicked */}
            {otpSent && (
              <div>
                <input type="text" inputMode="numeric" maxLength={6}
                  placeholder="6-digit code from email"
                  value={form.signupOtp}
                  onChange={e => setForm({ ...form, signupOtp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className={inp + " text-center font-bold tracking-widest"}
                  autoFocus />
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                  Check your inbox for a 6-digit code
                </p>
              </div>
            )}

            {/* Phone + Country Code */}
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value })}
                style={{ width: 90, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 6px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 12 }}>
                {countries.map(c => <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input type="tel" placeholder="Phone Number" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <input type={showPw ? "text" : "password"} placeholder="Password (min 6 chars)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} className={inp} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <input type={showCpw ? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={inp} required />
              <button type="button" onClick={() => setShowCpw(!showCpw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Terms & Conditions */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 2 }}>
              <input type="checkbox" checked={form.termsAccepted}
                onChange={e => setForm({ ...form, termsAccepted: e.target.checked })}
                style={{ marginTop: 2, accentColor: '#6b21a8' }} />
              <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                I agree to the{" "}
                <span style={{ color: '#6b21a8', fontWeight: 600 }}>Terms & Conditions</span>
              </span>
            </label>

            {/* Register Button */}
            <button type="submit" disabled={loading || !registerReady} className={btn} style={purpleGrad}>
              {loading ? "Creating Account..." : "Register"}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>
              Already have an account?{" "}
              <button type="button" onClick={() => setPage("login")} style={{ color: '#6b21a8', fontWeight: 700 }}>
                Login →
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
