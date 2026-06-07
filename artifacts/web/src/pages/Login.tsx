import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ArrowLeft, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type PageState = "register" | "register_otp" | "login";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-base" style={{ color: BRAND.blue }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: BRAND.red }}>
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-gray-600 leading-relaxed space-y-3">
          {children}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: BRAND.red }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage] = useState<PageState>("register");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", confirmEmail: "", password: "",
    confirmPassword: "", phone: "", country: "+92", referralCode: ""
  });
  const [otpCode, setOtpCode]           = useState("");
  const [referrerEmail, setReferrerEmail] = useState<string | null>(null);

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
    if (!agreedToTerms) return showMsg("Please agree to Terms & Conditions");

    setLoading(true);

    let referredByEmail: string | null = null;
    const refCode = form.referralCode.trim().toUpperCase();
    if (refCode) {
      const { data: refProf } = await supabase
        .from('profiles')
        .select('email')
        .eq('referral_code', refCode)
        .single();
      if (refProf) referredByEmail = refProf.email;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name:        form.fullName,
          phone:            form.country + form.phone,
          country:          form.country,
          referred_by_code: refCode || null,
        }
      }
    });

    if (error) {
      showMsg(error.message.includes("already") ? "Email already registered. Login instead." : error.message);
    } else {
      if (referredByEmail) setReferrerEmail(referredByEmail);
      setPage("register_otp");
      showMsg("6-digit OTP sent to your email", "success");
    }
    setLoading(false);
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return showMsg("Enter 6-digit OTP");
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otpCode,
      type: 'signup'
    });
    if (error) {
      showMsg("Invalid or expired OTP");
      setLoading(false);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: data.user.id,
        name: form.fullName,
        email: form.email,
        phone: form.country + form.phone,
        referral_code: generateReferralCode(),
        referred_by_code: form.referralCode.trim().toUpperCase() || null,
      }, { onConflict: 'user_id' });
      if (profileError) {
        console.error('Profile insert error:', profileError.message);
      }
    }
    showMsg("Account created successfully!", "success");
    setTimeout(() => window.location.replace('/showcase'), 1000);
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
      navigate('/showcase');
    }
    setLoading(false);
  };

  const inp = `w-full bg-white text-gray-800 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#1E3A8A] outline-none text-sm`;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundImage: "url('/assets/login-bg.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      {/* Modals */}
      {showTerms && (
        <Modal title="Terms & Conditions" onClose={() => setShowTerms(false)}>
          <p><strong>1. Acceptance of Terms</strong></p>
          <p>By accessing and using THE SUPER NFT platform, you accept and agree to be bound by these Terms & Conditions.</p>
          <p><strong>2. NFT Investments</strong></p>
          <p>All NFT investments carry risk. Past performance is not indicative of future results. Only invest what you can afford to lose.</p>
          <p><strong>3. Profit Distribution</strong></p>
          <p>Daily profits are distributed based on NFT package terms. Profits must be claimed manually through the platform.</p>
          <p><strong>4. Withdrawals</strong></p>
          <p>Withdrawals are subject to minimum limits and admin approval. Processing time is 5-30 minutes during business hours.</p>
          <p><strong>5. Account Security</strong></p>
          <p>Users are responsible for maintaining their account security. Do not share your login credentials with anyone.</p>
          <p><strong>6. Prohibited Activities</strong></p>
          <p>Users may not engage in fraud, money laundering, or any illegal activities on the platform.</p>
          <p><strong>7. Termination</strong></p>
          <p>THE SUPER NFT reserves the right to terminate accounts that violate these terms.</p>
        </Modal>
      )}
      {showPrivacy && (
        <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <p><strong>1. Information We Collect</strong></p>
          <p>We collect information you provide during registration: name, email, phone number, and country.</p>
          <p><strong>2. How We Use Your Information</strong></p>
          <p>Your information is used to provide platform services, process transactions, and communicate important updates.</p>
          <p><strong>3. Data Security</strong></p>
          <p>We use industry-standard encryption and security measures to protect your personal data.</p>
          <p><strong>4. Data Sharing</strong></p>
          <p>We do not sell or share your personal data with third parties except as required by law.</p>
          <p><strong>5. Cookies</strong></p>
          <p>We use cookies to maintain your session and improve user experience on our platform.</p>
          <p><strong>6. Your Rights</strong></p>
          <p>You have the right to access, correct, or delete your personal data at any time by contacting support.</p>
          <p><strong>7. Contact</strong></p>
          <p>For privacy-related inquiries, contact us through our Customer Service on Telegram.</p>
        </Modal>
      )}

      {msg.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg ${msg.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {msg.text}
        </div>
      )}

      <div className="rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}>
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: BRAND.blue }}>
            <span className="text-white font-extrabold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND.blue }}>
            {page === "login" ? "Welcome Back" : page === "register_otp" ? "Verify Email" : "Create Account"}
          </h1>
          <p className="text-xs text-gray-400 mt-1">THE SUPER NFT</p>
        </div>

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
                className="px-4 rounded-xl text-white font-bold text-xs whitespace-nowrap disabled:opacity-50"
                style={{ background: BRAND.red }}
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
                className="w-24 px-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800"
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
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
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
              onChange={e => { setForm({ ...form, referralCode: e.target.value }); setReferrerEmail(null); }}
              className={inp}
            />
            {referrerEmail && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-green-600 text-xs">✓</span>
                <p className="text-xs text-green-700 font-medium">Referred by: {referrerEmail}</p>
              </div>
            )}

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <div
                  onClick={() => setAgreedToTerms(v => !v)}
                  className="w-4.5 h-4.5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: 18, height: 18,
                    borderColor: agreedToTerms ? BRAND.red : "#D1D5DB",
                    background: agreedToTerms ? BRAND.red : "white",
                  }}
                >
                  {agreedToTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowTerms(true); }}
                  className="font-semibold underline"
                  style={{ color: BRAND.blue }}
                >
                  Terms & Conditions
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowPrivacy(true); }}
                  className="font-semibold underline"
                  style={{ color: BRAND.blue }}
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <p className="text-xs text-center text-gray-400">Click "Send OTP" to get a 6-digit code on your email</p>
            <button
              onClick={() => setPage("login")}
              className="text-sm font-semibold w-full text-center"
              style={{ color: BRAND.blue }}
            >
              Already have an account? Login
            </button>
          </div>
        )}

        {/* ── OTP Verify Form ─── */}
        {page === "register_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-xl p-4 text-center" style={{ background: "#EFF6FF" }}>
              <Mail className="mx-auto mb-1" size={22} style={{ color: BRAND.blue }} />
              <p className="text-xs text-gray-600">OTP sent to <b>{form.email}</b></p>
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
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: BRAND.red }}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm text-gray-400 w-full flex items-center justify-center gap-1"
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
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold transition-colors"
                style={{ color: BRAND.blue }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = BRAND.red)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = BRAND.blue)}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: BRAND.red }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={() => setPage("register")}
              className="text-sm font-semibold w-full text-center"
              style={{ color: BRAND.blue }}
            >
              No account? Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
