import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { registerUser, loginUser, setCurrentUser } from "../lib/api";

type PopupType = { show: boolean; message: string; type: string };

function Popup({ popup }: { popup: PopupType }) {
  if (!popup.show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm">
      <div className={`px-6 py-4 rounded-lg shadow-2xl border-2 text-center ${
        popup.type === "success" ? "bg-slate-50 border-slate-400 text-slate-900" : "bg-red-50 border-red-500 text-red-900"
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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  // pages: "register" | "login" | "forgot" | "forgot_sent"
  const [page, setPage] = useState("register");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", confirmEmail: "",
    phone: "", countryCode: "+1", password: "", confirmPassword: "",
    referralCode: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setForm(f => ({ ...f, referralCode: ref }));
    // If ?mode=login, start on login tab
    if (params.get('mode') === 'login') setPage('login');
  }, []);

  const showMsg = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  const inp = "w-full bg-white text-[#1E293B] px-4 py-3 rounded-lg border border-[#BFDBFE] focus:border-[#1E3A8A] outline-none text-base placeholder:text-slate-400";

  // ── Register ────────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email !== form.confirmEmail) { showMsg("Emails do not match"); return; }
    if (form.password !== form.confirmPassword) { showMsg("Passwords do not match"); return; }
    if (form.password.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const result = await registerUser({
        name: form.fullName,
        email: form.email,
        phone: `${form.countryCode}${form.phone}`,
        password: form.password,
        country: form.countryCode,
        referralCode: form.referralCode || undefined,
      });
      if (result === 'email_exists') { showMsg("Email already registered. Please login."); return; }
      setCurrentUser(result.id);
      showMsg("Registration successful! Welcome to THE SUPER NFT", "success");
      setTimeout(() => setLocation('/showcase'), 1500);
    } catch { showMsg("Registration failed. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginUser(form.email, form.password);
      if (result === 'blocked') { showMsg("Your account has been blocked. Contact support."); return; }
      if (result === 'invalid') { showMsg("Wrong email or password"); return; }
      setCurrentUser(result.id);
      showMsg("Login successful!", "success");
      setTimeout(() => setLocation('/showcase'), 800);
    } catch { showMsg("Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Forgot Password ─────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { showMsg("Please enter your email"); return; }
    setLoading(true);
    try {
      await fetch("/api/nft/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setPage("forgot_sent");
    } catch { showMsg("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const bgStyle = { background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)', padding: '20px' };
  const cardStyle = { background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(30,58,138,0.3)', width: '90%', maxWidth: 400 };

  return (
    <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
      <Popup popup={popup} />
      <div style={cardStyle}>
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 rounded-xl object-cover" />
          <h1 className="text-3xl font-bold" style={{ color: '#1E293B' }}>THE SUPER NFT</h1>
          <p className="text-sm mt-1 font-medium text-slate-500">Welcome to Community World</p>
        </div>

        {/* ── REGISTER ── */}
        {page === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className={inp} required />
            <input type="text" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className={inp} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} required />
            <input type="email" placeholder="Confirm Email" value={form.confirmEmail} onChange={e => setForm({...form, confirmEmail: e.target.value})} className={inp} required />
            <div className="flex gap-2">
              <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})}
                className="w-24 bg-white text-[#1E293B] px-2 py-3 rounded-lg border border-[#BFDBFE] focus:border-[#1E3A8A] outline-none text-sm">
                {countries.map(c => <option key={c.code+c.name} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="flex-1 bg-white text-[#1E293B] px-4 py-3 rounded-lg border border-[#BFDBFE] focus:border-[#1E3A8A] outline-none text-base placeholder:text-slate-400" />
            </div>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inp} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <input type={showCpw ? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className={inp} required />
              <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showCpw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <input type="text" placeholder="Referral Code / UID (Optional)" value={form.referralCode} onChange={e => setForm({...form, referralCode: e.target.value})} className={inp} />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base text-white" style={{ background: '#1E3A8A' }}>
              {loading ? "Creating account..." : "Register Now"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have account?{" "}
              <button type="button" onClick={() => setPage("login")} className="font-semibold" style={{ color: '#1E40AF' }}>Login</button>
            </p>
          </form>
        )}

        {/* ── LOGIN ── */}
        {page === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} required />
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inp} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password link */}
            <div className="text-right -mt-1">
              <button type="button" onClick={() => { setPage("forgot"); setForgotEmail(form.email); }}
                className="text-xs font-semibold hover:underline" style={{ color: '#1E40AF' }}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base text-white" style={{ background: '#1E3A8A' }}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Don't have account?{" "}
              <button type="button" onClick={() => setPage("register")} className="font-semibold" style={{ color: '#1E40AF' }}>Register Now</button>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {page === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setPage("login")} className="text-slate-500 hover:text-slate-700">
                <ArrowLeft size={20} />
              </button>
              <p className="font-bold text-slate-800">Reset Password</p>
            </div>
            <p className="text-sm text-slate-500">Enter your email address and we'll send you a link to reset your password.</p>
            <input type="email" placeholder="Your email address" value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)} className={inp} required autoFocus />
            <button type="submit" disabled={loading || !forgotEmail.trim()}
              className="w-full py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base text-white" style={{ background: '#1E3A8A' }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Remembered your password?{" "}
              <button type="button" onClick={() => setPage("login")} className="font-semibold" style={{ color: '#1E40AF' }}>Login</button>
            </p>
          </form>
        )}

        {/* ── FORGOT SENT ── */}
        {page === "forgot_sent" && (
          <div className="text-center py-4 space-y-4">
            <CheckCircle size={52} className="text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-lg">Check Your Email!</p>
            <p className="text-sm text-slate-500">
              If <strong>{forgotEmail}</strong> is registered, you'll receive a password reset link shortly.
            </p>
            <p className="text-xs text-slate-400">Check your spam folder if you don't see it.</p>
            <button onClick={() => setPage("login")}
              className="w-full py-3 rounded-lg font-semibold text-white" style={{ background: '#1E3A8A' }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
