import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
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

type PageState = "login" | "forgot" | "forgot_otp";

export default function LoginPage() {
  const [page, setPage] = useState<PageState>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showNewPw2, setShowNewPw2] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const [forgotEmail, setForgotEmail]           = useState("");
  const [forgotOtp, setForgotOtp]               = useState("");
  const [forgotNewPass, setForgotNewPass]       = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/showcase');
    });
  }, []);

  const showMsg = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3500);
  };

  const inp = "w-full bg-white/90 text-[#1E293B] px-3 py-2.5 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";
  const btn = "w-full py-2.5 rounded-lg font-bold text-white text-sm shadow-lg disabled:opacity-50";
  const purpleGrad = { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { showMsg("Invalid email or password"); return; }
      showMsg("Login successful!", "success");
      setTimeout(() => { window.location.replace('/showcase'); }, 800);
    } catch { showMsg("Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Forgot: send OTP ──────────────────────────────────────────────────────
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

  // ── Forgot: verify OTP + set new password ────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) { showMsg("Please enter the 6-digit OTP"); return; }
    if (forgotNewPass.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    if (forgotNewPass !== forgotConfirmPass) { showMsg("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: forgotEmail, token: forgotOtp, type: 'email',
      });
      if (otpErr) { showMsg("Incorrect OTP or expired. Try again."); return; }
      const { error: updateErr } = await supabase.auth.updateUser({ password: forgotNewPass });
      if (updateErr) { showMsg(updateErr.message); return; }
      showMsg("Password reset! Please login.", "success");
      setTimeout(() => {
        setPage("login");
        setEmail(forgotEmail);
        setPassword("");
        setForgotOtp(""); setForgotNewPass(""); setForgotConfirmPass("");
      }, 2000);
    } catch { showMsg("Reset failed. Please try again."); }
    finally { setLoading(false); }
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
      <style>{`@media(max-width:768px){.login-card{max-width:360px!important;padding:24px 18px!important;}}`}</style>
      <Popup popup={popup} />

      <div
        className="login-card"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          boxShadow: '0 8px 48px rgba(80,20,120,0.25)',
          width: '90vw',
          maxWidth: 400,
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/logo.png" alt="Logo"
            style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 10px', display: 'block', objectFit: 'cover' }} />
          <p style={{ fontWeight: 800, fontSize: 18, color: '#1E293B', letterSpacing: 0.5 }}>
            {page === 'login' ? 'Welcome Back' : 'Reset Password'}
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>THE SUPER NFT</p>
        </div>

        {/* ── Login ── */}
        {page === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} className={inp} required autoFocus />

            <div style={{ position: 'relative' }}>
              <input type={showPw ? "text" : "password"} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} className={inp} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <button type="button"
                onClick={() => { setPage("forgot"); setForgotEmail(email); }}
                style={{ fontSize: 11, color: '#6b21a8', fontWeight: 600 }}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className={btn} style={purpleGrad}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Don't have an account?{" "}
              <a href="/signup" style={{ color: '#6b21a8', fontWeight: 700 }}>Sign Up →</a>
            </p>
          </form>
        )}

        {/* ── Forgot: enter email ── */}
        {page === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button type="button" onClick={() => setPage("login")} style={{ color: '#94a3b8' }}>
                <ArrowLeft size={16} />
              </button>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Forgot Password</p>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Enter your email — we'll send you an OTP</p>
            <input type="email" placeholder="Your email" value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)} className={inp} required autoFocus />
            <button type="submit" disabled={loading || !forgotEmail.trim()} className={btn} style={purpleGrad}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── Forgot: enter OTP + new password ── */}
        {page === 'forgot_otp' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button type="button" onClick={() => setPage("forgot")} style={{ color: '#94a3b8' }}>
                <ArrowLeft size={16} />
              </button>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Set New Password</p>
            </div>

            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <CheckCircle size={16} style={{ color: '#10b981', margin: '0 auto 4px', display: 'block' }} />
              <p style={{ fontSize: 10, color: '#64748b' }}>OTP sent to <strong>{forgotEmail}</strong></p>
            </div>

            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit OTP" value={forgotOtp}
              onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inp + " text-center font-bold tracking-widest"} autoFocus />

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

            <button type="submit"
              disabled={loading || forgotOtp.length !== 6 || !forgotNewPass}
              className={btn} style={purpleGrad}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
