import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabase";

type PopupType = { show: boolean; message: string; type: string };

function Popup({ popup }: { popup: PopupType }) {
  if (!popup.show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w- max-w-sm">
      <div className={`px-6 py-4 rounded-lg shadow-2xl border-2 text-center ${
        popup.type === "success"? "bg-white border-emerald-400 text-slate-900" : "bg-red-50 border-red-500 text-red-900"
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

type PageState = "register" | "register_otp" | "login" | "forgot" | "forgot_otp";

export default function LoginPage() {
  const [page, setPage] = useState<PageState>("register");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });
  const [form, setForm] = useState({
    fullName: "", email: "", confirmEmail: "",
    phone: "", countryCode: "+92", password: "", confirmPassword: "",
    referralCode: "",
  });
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");

  useEffect(() => {
    // If already logged in, go straight to showcase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/showcase');
    });
    // Also listen for SIGNED_IN event (covers cases where session arrives async)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) window.location.replace('/showcase');
    });
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setForm(f => ({...f, referralCode: ref }));
    if (params.get('mode') === 'login') setPage('login');
    if (ref && params.get('mode')!== 'login') setPage('register');
    return () => subscription.unsubscribe();
  }, []);

  const showMsg = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3500);
  };

  const inp = "w-full bg-white/90 text-[#1E293B] px-3 py-2.5 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-sm placeholder:text-slate-400";
  const btn = "w-full py-2.5 rounded-lg font-bold text-white text-sm shadow-lg disabled:opacity-50";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email !== form.confirmEmail) { showMsg("Emails do not match"); return; }
    if (form.password !== form.confirmPassword) { showMsg("Passwords do not match"); return; }
    if (form.password.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: `${form.countryCode}${form.phone}`,
            country: form.countryCode,
            referral_code: form.referralCode || null,
          }
        }
      });

      if (authError) {
        console.error('SUPABASE AUTH ERROR:', authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('User object not returned from signUp');
      }

      const { id, email: userEmail } = authData.user;
      console.log('Auth user created:', id);

      // 1. Insert into public.users
      const { error: usersError } = await supabase
        .from('users')
        .upsert({ id, email: userEmail });

      if (usersError) {
        console.error('FAILED: public.users insert', usersError);
      } else {
        console.log('SUCCESS: public.users insert');
      }

      // 2. Insert into public.wallets - ALL REQUIRED COLUMNS
      const { error: walletsError } = await supabase
        .from('wallets')
        .insert({
          user_id: id,
          balance: 0,
          total_deposit: 0,
          total_withdraw: 0,
          frozen_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (walletsError) {
        console.error('FAILED: public.wallets insert', walletsError);
      } else {
        console.log('SUCCESS: public.wallets insert');
      }

      // 3. Insert into public.user_income
      const { error: incomeError } = await supabase
        .from('user_income')
        .insert({
          user_id: id,
          total_income: 0,
          reserve_income: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (incomeError) {
        console.error('FAILED: public.user_income insert', incomeError);
      } else {
        console.log('SUCCESS: public.user_income insert');
      }

      if (usersError || walletsError || incomeError) {
        throw new Error('Database insert failed. Check browser console for details.');
      }

      console.log('SIGNUP COMPLETE: All 3 tables inserted successfully');

      setOtpEmail(form.email);
      setOtpCode("");
      setPage("register_otp");
      showMsg("OTP sent to your email. Please check your inbox.", "success");
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length!== 6) { showMsg("Please enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        showMsg("Incorrect OTP or expired. Try again.");
        return;
      }

      showMsg("Email verified! Logging you in...", "success");
      setTimeout(() => { window.location.replace('/showcase'); }, 1000);
    } catch { showMsg("Verification failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          showMsg("Please verify your email first. Check inbox for OTP.");
        } else if (error.message.includes("Invalid login credentials")) {
          showMsg("Wrong email or password.");
        } else {
          showMsg(error.message);
        }
        return;
      }

      showMsg("Login successful!", "success");
      setTimeout(() => { window.location.replace('/showcase'); }, 800);
    } catch { showMsg("Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) { showMsg("Please enter your email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(otpEmail.trim());

      if (error) {
        showMsg(error.message);
        return;
      }

      setOtpCode(""); setForgotNewPass(""); setForgotConfirmPass("");
      setPage("forgot_otp");
      showMsg("OTP sent to your email. Check your inbox.", "success");
    } catch { showMsg("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length!== 6) { showMsg("Please enter the 6-digit OTP"); return; }
    if (!forgotNewPass || forgotNewPass.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    if (forgotNewPass!== forgotConfirmPass) { showMsg("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode,
        type: 'recovery'
      });

      if (error) {
        showMsg("Incorrect OTP or expired. Try again.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: forgotNewPass
      });

      if (updateError) {
        showMsg(updateError.message);
        return;
      }

      showMsg("Password reset successfully! Please login.", "success");
      setTimeout(() => { setPage("login"); setForm(f => ({...f, email: otpEmail, password: "" })); }, 2000);
    } catch { showMsg("Reset failed. Please try again."); }
    finally { setLoading(false); }
  };

  const purpleGrad = { background: 'linear-gradient(135deg, #6b21a8 0%, #4f46e5 100%)' };

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
          maxWidth: 780,
          minHeight: 480,
          overflow: 'hidden',
          marginTop: '-2vh',
        }}
      >
        <div className="nft-col" style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <img src="/images/logo.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 10, margin: '0 auto 8px', display: 'block', objectFit: 'cover' }} />
            <p style={{ fontWeight: 800, fontSize: 15, color: '#1E293B', letterSpacing: 0.5 }}>Login</p>
          </div>

          {(page === "login" || page === "register" || page === "register_otp") && (
            <>
              {page === "login" && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="email" placeholder="Email" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} className={inp} required />
                  <div style={{ position: 'relative' }}>
                    <input type={showPw? "text" : "password"} placeholder="Password" value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})} className={inp} required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      {showPw? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: -4 }}>
                    <button type="button" onClick={() => { setPage("forgot"); setOtpEmail(form.email); }}
                      style={{ fontSize: 11, color: '#6b21a8', fontWeight: 600 }}>Forgot Password?</button>
                  </div>
                  <button type="submit" disabled={loading} className={btn} style={purpleGrad}>
                    {loading? "Logging in..." : "Login"}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                    No account?{" "}
                    <button type="button" onClick={() => setPage("register")} style={{ color: '#6b21a8', fontWeight: 700 }}>
                      Sign Up →
                    </button>
                  </p>
                </form>
              )}

              {(page === "register" || page === "register_otp") && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                    Already have an account?
                  </p>
                  <button onClick={() => setPage("login")} className={btn} style={{...purpleGrad, padding: '10px 0' }}>
                    Go to Login →
                  </button>
                </div>
              )}
            </>
          )}

          {page === "forgot" && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button type="button" onClick={() => setPage("login")} style={{ color: '#94a3b8' }}><ArrowLeft size={16} /></button>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>Reset Password</p>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Enter your email to receive OTP</p>
              <input type="email" placeholder="Your email" value={otpEmail}
                onChange={e => setOtpEmail(e.target.value)} className={inp} required autoFocus />
              <button type="submit" disabled={loading ||!otpEmail.trim()} className={btn} style={purpleGrad}>
                {loading? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {page === "forgot_otp" && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button type="button" onClick={() => setPage("forgot")} style={{ color: '#94a3b8' }}><ArrowLeft size={16} /></button>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>OTP & New Password</p>
              </div>
              <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                <CheckCircle size={16} style={{ color: '#10b981', margin: '0 auto 4px', display: 'block' }} />
                <p style={{ fontSize: 10, color: '#64748b' }}>OTP sent to <strong>{otpEmail}</strong></p>
              </div>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={inp + " text-center text-lg font-bold tracking-"} autoFocus />
              <div style={{ position: 'relative' }}>
                <input type={showNewPw? "text" : "password"} placeholder="New Password"
                  value={forgotNewPass} onChange={e => setForgotNewPass(e.target.value)} className={inp} required />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showNewPw? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input type="password" placeholder="Confirm Password" value={forgotConfirmPass}
                onChange={e => setForgotConfirmPass(e.target.value)} className={inp} required />
              <button type="submit" disabled={loading || otpCode.length!== 6 ||!forgotNewPass}
                className={btn} style={purpleGrad}>
                {loading? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <div className="nft-divider" style={{ width: 1, borderLeft: '1px solid rgba(106,27,154,0.15)', alignSelf: 'stretch' }} />

        <div className="nft-col" style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#1E293B', letterSpacing: 0.5 }}>Sign Up</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Join THE SUPER NFT</p>
          </div>

          {page === "register" && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Full Name" value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})} className={inp} required />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} className={inp} required />
              <input type="email" placeholder="Confirm Email" value={form.confirmEmail}
                onChange={e => setForm({...form, confirmEmail: e.target.value})} className={inp} required />
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})}
                  style={{ width: 90, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 6px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 12 }}>
                  {countries.map(c => <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input type="tel" placeholder="Phone Number" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.9)', color: '#1E293B', padding: '8px 12px', borderRadius: 8, border: '1px solid #e9d5ff', outline: 'none', fontSize: 13 }} />
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw? "text" : "password"} placeholder="Password (min 6 chars)" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} className={inp} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showPw? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showCpw? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})} className={inp} required />
                <button type="button" onClick={() => setShowCpw(!showCpw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  {showCpw? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.referralCode && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#15803d' }}>
                  ✅ Referred by: <strong>{form.referralCode}</strong>
                </div>
              )}
              <input type="text" placeholder="Referral Code (Optional)" value={form.referralCode}
                onChange={e => setForm({...form, referralCode: e.target.value})} className={inp} />
              <button type="submit" disabled={loading} className={btn} style={purpleGrad}>
                {loading? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}

          {page === "register_otp" && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button type="button" onClick={() => setPage("register")} style={{ color: '#94a3b8' }}><ArrowLeft size={16} /></button>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>Verify Email</p>
              </div>
              <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                <CheckCircle size={16} style={{ color: '#10b981', margin: '0 auto 4px', display: 'block' }} />
                <p style={{ fontSize: 10, color: '#64748b' }}>OTP sent to <strong>{otpEmail}</strong></p>
              </div>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={inp + " text-center text-lg font-bold tracking-"} autoFocus />
              <button type="submit" disabled={loading || otpCode.length!== 6} className={btn} style={purpleGrad}>
                {loading? "Verifying..." : "Verify & Login"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}