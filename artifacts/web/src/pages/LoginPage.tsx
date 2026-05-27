import { useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState("register");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    confirmEmail: "",
    phone: "",
    countryCode: "+92",
    password: "",
    confirmPassword: "",
    referralCode: "",
    otp: ""
  });

  const countries = [
    { code: "+92", name: "Pakistan" },
    { code: "+91", name: "India" },
    { code: "+1", name: "USA" },
    { code: "+44", name: "UK" },
    { code: "+971", name: "UAE" },
    { code: "+966", name: "Saudi" },
    { code: "+880", name: "Bangladesh" },
    { code: "+94", name: "Sri Lanka" },
    { code: "+977", name: "Nepal" },
    { code: "+60", name: "Malaysia" },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email !== formData.confirmEmail) {
      alert("Email aur Confirm Email match nahi kar rahi");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Password aur Confirm Password match nahi kar rahe");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        confirmEmail: formData.confirmEmail,
        phoneCountryCode: formData.countryCode,
        phoneNumber: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        referralCode: formData.referralCode,
      })
    });
    setLoading(false);
    if (res.ok) {
      setPage("otp");
      alert("6 Digit Code aapke email pe bhej diya gaya hai");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Error: OTP nahi bheja ja saka");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, code: formData.otp })
    });
    setLoading(false);
    if (res.ok) {
      setPage("congratulations");
    } else {
      alert("OTP ghalat hai ya expire ho gaya");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, password: formData.password })
    });
    setLoading(false);
    if (res.ok) {
      setLocation("/");
    } else {
      alert("Email ya Password ghalat hai");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email })
    });
    setLoading(false);
    if (res.ok) {
      alert("Password reset link aapke email pe bhej di gayi");
      setPage("login");
    } else {
      alert("Error: Reset link nahi bheja ja saka");
    }
  };

  const inputCls = "w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #d1fae5 100%)'}}>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto mb-3"></div>
          <h1 className="text-3xl font-bold text-slate-900">THE SUPER NFT</h1>
          <p className="text-green-600 text-sm mt-1 font-medium">Welcome to Community World</p>
        </div>

        {page === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className={inputCls} required />
            <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={inputCls} required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputCls} required />
            <input type="email" placeholder="Confirm Email" value={formData.confirmEmail} onChange={(e) => setFormData({...formData, confirmEmail: e.target.value})} className={inputCls} required />
            <div className="flex gap-2">
              <select value={formData.countryCode} onChange={(e) => setFormData({...formData, countryCode: e.target.value})} className="bg-slate-50 text-slate-900 px-3 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none">
                {countries.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
              </select>
              <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="flex-1 bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none" required />
            </div>
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={inputCls} required />
            <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={inputCls} required />
            <input type="text" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={(e) => setFormData({...formData, referralCode: e.target.value})} className={inputCls} />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50">
              {loading ? "Processing..." : "Register Now"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have account?{" "}
              <button type="button" onClick={() => setPage("login")} className="text-green-600 font-semibold hover:text-green-700">Login Accounts</button>
            </p>
          </form>
        )}

        {page === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-slate-600 text-sm text-center">Code sent to: <strong>{formData.email}</strong></p>
            <input
              type="text"
              placeholder="Enter 6 Digit Email Code"
              maxLength={6}
              value={formData.otp}
              onChange={(e) => setFormData({...formData, otp: e.target.value})}
              className="w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none text-center text-2xl tracking-widest"
              required
            />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50">
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button type="button" onClick={() => setPage("register")} className="w-full text-slate-500 text-sm hover:text-slate-700">
              Back to Register
            </button>
          </form>
        )}

        {page === "congratulations" && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900">Congratulations!</h2>
            <p className="text-slate-600">Welcome <strong>{formData.username}</strong></p>
            <p className="text-sm text-slate-500">Your account has been created successfully</p>
            <button onClick={() => setPage("login")} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg">
              Continue to Login
            </button>
          </div>
        )}

        {page === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputCls} required />
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={inputCls} required />
            <div className="text-right">
              <button type="button" onClick={() => setPage("forgot")} className="text-sm text-green-600 hover:text-green-700">Forgot Password?</button>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50">
              {loading ? "Logging In..." : "Login Accounts"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Don't have account?{" "}
              <button type="button" onClick={() => setPage("register")} className="text-green-600 font-semibold hover:text-green-700">Register Now</button>
            </p>
          </form>
        )}

        {page === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-slate-600 text-sm text-center">Enter your email to reset password</p>
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputCls} required />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => setPage("login")} className="w-full text-slate-600 text-sm hover:text-slate-900 mt-2">
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
