import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ArrowLeft, X, User, Lock, Gift } from "lucide-react";
import { supabase } from "../lib/supabase";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

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
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }));
      sessionStorage.setItem('pending_referral_code', ref);
    }
  }, []);

  const showMsg = (text: string, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleSendOtp = async () => {
    if (!form.fullName.trim()) return showMsg("Enter your full name");
    if (!form.email || form.email !== form.confirmEmail) return showMsg("Emails do not match");
    if (form.password !== form.confirmPassword) return showMsg("Passwords do not match");
    if (form.password.length < 6) return showMsg("Password must be at least 6 characters");
    if (!agreedToTerms) return showMsg("Please agree to Terms & Conditions");

    setLoading(true);

    const refCode = form.referralCode.trim().toUpperCase() ||
      sessionStorage.getItem('pending_referral_code') || '';

    let authData = null;
    let signupError: Error | { message: string; code?: string } | null = null;

    try {
      const result = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            name: form.fullName.trim(),
            phone: form.phone ? `+${form.phone.trim()}` : '',
          },
        },
      });
      authData = result.data;
      signupError = result.error;
    } catch (err) {
      signupError = err as Error;
    }

    if (signupError) {
      setLoading(false);
      const msg = (signupError as { message: string }).message ?? "";
      if (msg.toLowerCase().includes("already")) {
        showMsg("Email already registered. Please login.");
      } else {
        showMsg(msg || "Registration failed. Please try again.");
      }
      return;
    }
    if (!authData || !authData.user) {
      setLoading(false);
      showMsg("Registration failed. Please try again.");
      return;
    }

    if (authData.session) {
      // Email auto-confirmed — create profile via server (uses service role key, bypasses RLS)
      const profileRes = await fetch('/api/nft/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken:  authData.session.access_token,
          userId:       authData.user.id,
          email:        form.email.trim().toLowerCase(),
          name:         form.fullName.trim(),
          phone:        form.phone ? "+" + form.phone.trim() : "",
          referralCode: refCode,
        }),
      });

      setLoading(false);

      if (!profileRes.ok) {
        const j = await profileRes.json() as { error?: string };
        showMsg(j.error ?? "Profile setup failed. Please contact support.");
        return;
      }

      sessionStorage.removeItem('pending_referral_code');
      window.location.replace('/showcase');
    } else {
      // Email confirmation required — wait for OTP
      setLoading(false);
      setPage("register_otp");
      showMsg("6-digit OTP sent to your email", "success");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return showMsg("Enter the 6-digit OTP");
    setLoading(true);

    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email.trim().toLowerCase(),
      token: otpCode,
      type: 'signup',
    });

    if (verifyError || !authData.user) {
      showMsg("Invalid or expired OTP. Please try again.");
      setLoading(false);
      return;
    }

    const refCode = form.referralCode.trim().toUpperCase() ||
      sessionStorage.getItem('pending_referral_code') || '';

    // Create profile via server (uses service role key, bypasses RLS)
    const profileRes = await fetch('/api/nft/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken:  authData.session?.access_token ?? '',
        userId:       authData.user.id,
        email:        form.email.trim().toLowerCase(),
        name:         form.fullName.trim(),
        phone:        form.phone ? "+" + form.phone.trim() : "",
        referralCode: refCode,
      }),
    });

    setLoading(false);

    if (!profileRes.ok) {
      const j = await profileRes.json() as { error?: string };
      showMsg(j.error ?? "Account created but profile setup failed. Please contact support.");
      return;
    }

    sessionStorage.removeItem('pending_referral_code');
    showMsg("Account created successfully!", "success");
    setTimeout(() => window.location.replace('/showcase'), 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (error) {
      showMsg(error.message.toLowerCase().includes("confirm")
        ? "Please verify your email first"
        : "Wrong email or password");
    } else {
      navigate('/showcase');
    }
    setLoading(false);
  };

  const inp = `w-full bg-white text-gray-800 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm`;
  const inpIcon = `w-full bg-white text-gray-800 pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-[#0a0a1f] via-[#1a0b3d] to-[#0a0a1f]">
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
          <p>We use cookies and session storage to maintain your session and improve user experience.</p>
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

      {/* ── Register: Branding above card ── */}
      {page === "register" && (
        <div className="text-center mb-5 select-none">
          <img src="/assets/logo.png" alt="Super NFT" className="h-20 w-auto mx-auto mb-3 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]" />
          <h1 className="text-4xl font-black tracking-wide">
            <span style={{ background: "linear-gradient(90deg,#a855f7,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SUPER </span>
            <span className="text-white">NFT</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-pink-400 text-base">✦</span>
            <p className="text-gray-300 text-sm tracking-wide">Join The Super Nft Community World</p>
            <span className="text-cyan-400 text-base">✦</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl w-full max-w-md shadow-2xl border border-white/20"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
          padding: page === "register" ? "24px" : "32px" }}>

        {/* ── Register header inside card ── */}
        {page === "register" && (
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
              <User size={20} style={{ color: BRAND.blue }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND.blue }}>Create Account</h2>
              <p className="text-xs text-gray-400">Sign up to get started</p>
            </div>
          </div>
        )}

        {/* ── Login/OTP header ── */}
        {page !== "register" && (
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: BRAND.blue }}>
              <span className="text-white font-extrabold text-xl">N</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND.blue }}>
              {page === "login" ? "Welcome Back" : "Verify Email"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">THE SUPER NFT</p>
          </div>
        )}

        {/* ── Register Form ─── */}
        {page === "register" && (
          <div className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                placeholder="Full Name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Email + Send OTP button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inpIcon}
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="px-4 rounded-xl text-white font-bold text-xs whitespace-nowrap disabled:opacity-50 flex-shrink-0"
                style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>

            {/* Confirm Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Confirm Email"
                value={form.confirmEmail}
                onChange={e => setForm({ ...form, confirmEmail: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Phone */}
            <PhoneInput
              country="us"
              enableSearch
              countryCodeEditable={false}
              value={form.phone}
              onChange={phone => setForm({ ...form, phone })}
              inputStyle={{ width: "100%", height: "42px", fontSize: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", background: "#fff", color: "#1f2937" }}
              buttonStyle={{ borderRadius: "12px 0 0 12px", border: "1px solid #e5e7eb", borderRight: "none", background: "#fff" }}
              containerStyle={{ width: "100%" }}
            />

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inpIcon + " pr-9"}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Referral Code */}
            <div className="relative">
              <Gift size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
              <input
                placeholder="Referral Code (Optional)"
                value={form.referralCode}
                onChange={e => setForm({ ...form, referralCode: e.target.value })}
                className={inpIcon}
              />
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  onClick={() => setAgreedToTerms(v => !v)}
                  className="rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: 18, height: 18,
                    borderColor: agreedToTerms ? "#8B5CF6" : "#D1D5DB",
                    background: agreedToTerms ? "#8B5CF6" : "white",
                  }}
                >
                  {agreedToTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <label className="text-xs text-gray-500 leading-relaxed cursor-pointer" onClick={() => setAgreedToTerms(v => !v)}>
                I agree to the{" "}
                <button type="button" onClick={e => { e.stopPropagation(); setShowTerms(true); }}
                  className="font-semibold underline" style={{ color: "#3B82F6" }}>
                  Terms of Service
                </button>
                {" "}and{" "}
                <button type="button" onClick={e => { e.stopPropagation(); setShowPrivacy(true); }}
                  className="font-semibold underline" style={{ color: "#3B82F6" }}>
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Sign Up button */}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
              style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
            >
              {loading ? "Please wait..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={() => setPage("login")}
              className="text-sm w-full text-center text-gray-500"
            >
              Already have an account?{" "}
              <span className="font-semibold" style={{ color: "#3B82F6" }}>Login</span>
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
              style={{ background: "linear-gradient(90deg,#8B5CF6,#3B82F6)" }}
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold transition-colors"
                style={{ color: BRAND.blue }}
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
