import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

type PageState = "register" | "register_otp" | "login";

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage] = useState<PageState>("register");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [form, setForm] = useState({
    fullName: "", email: "", confirmEmail: "", password: "",
    confirmPassword: "", phone: "", country: "+92", referralCode: ""
  });
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setForm(f => ({ ...f, referralCode: ref }));
  }, []);

  const showMsg = (text: string, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleSendOtp = async () => {
    if (!form.fullName) return showMsg("Enter full name");
    if (!form.email || form.email !== form.confirmEmail) return showMsg("Emails do not match");
    if (form.password !== form.confirmPassword) return showMsg("Passwords do not match");
    if (form.password.length < 6) return showMsg("Password min 6 chars");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.country + form.phone,
          country: form.country,
          referral_code: form.referralCode || null,
        }
      }
    });

    if (error) {
      showMsg(error.message.includes("already") ? "Email already registered. Login instead." : error.message);
    } else {
      setPage("register_otp");
      showMsg("6-digit OTP sent to your email", "success");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return showMsg("Enter 6-digit OTP");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otpCode,
      type: 'signup'
    });
    if (error) showMsg("Invalid or expired OTP");
    else {
      showMsg("Account created successfully!", "success");
      setTimeout(() => navigate('/'), 1000);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      showMsg(error.message.includes("confirm") ? "Please verify your email first" : "Wrong email or password");
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const inp = "w-full bg-white text-slate-900 px-3 py-2.5 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-sm";
  const btn = "w-full py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-50";
  const grad = { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      {msg.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white font-semibold text-sm shadow-lg ${msg.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900">
          {page === "login" ? "Login" : page === "register_otp" ? "Verify OTP" : "Create Account"}
        </h1>

        {/* ── Register Form ─── */}
        {page === "register" && (
          <div className="space-y-3">
            <input
              placeholder="Full Name"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className={inp}
            />
            <div className="flex gap-2">
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inp}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="px-4 rounded-lg text-white font-bold text-xs whitespace-nowrap disabled:opacity-50"
                style={grad}
              >
                {loading ? "..." : "Send OTP"}
              </button>
            </div>
            <input
              placeholder="Confirm Email"
              type="email"
              value={form.confirmEmail}
              onChange={e => setForm({ ...form, confirmEmail: e.target.value })}
              className={inp}
            />
            <div className="flex gap-2">
              <select
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-24 px-2 rounded-lg border border-purple-200 text-sm bg-white"
              >
                <option value="+92">🇵🇰 +92</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+966">🇸🇦 +966</option>
              </select>
              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className={inp}
              />
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inp}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-slate-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className={inp}
            />
            <input
              placeholder="Referral Code (Optional)"
              value={form.referralCode}
              onChange={e => setForm({ ...form, referralCode: e.target.value })}
              className={inp}
            />
            <p className="text-xs text-center text-slate-400">Click "Send OTP" to get a 6-digit code on your email</p>
            <button onClick={() => setPage("login")} className="text-sm text-purple-600 font-semibold w-full text-center">
              Already have an account? Login
            </button>
          </div>
        )}

        {/* ── OTP Verify Form ─── */}
        {page === "register_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <Mail className="mx-auto mb-1 text-blue-600" size={22} />
              <p className="text-xs text-slate-600">OTP sent to <b>{form.email}</b></p>
            </div>
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className={inp + " text-center text-2xl tracking-widest font-bold"}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={btn}
              style={grad}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm text-slate-500 w-full flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Sign Up
            </button>
          </form>
        )}

        {/* ── Login Form ─── */}
        {page === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={inp}
              required
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inp}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-slate-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className={btn} style={grad}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm text-purple-600 font-semibold w-full text-center"
            >
              No account? Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
