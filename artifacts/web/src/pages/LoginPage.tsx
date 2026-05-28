import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff } from "lucide-react";

type PopupType = { show: boolean; message: string; type: string };

function Popup({ popup }: { popup: PopupType }) {
  if (!popup.show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm">
      <div className={`px-6 py-4 rounded-lg shadow-2xl border-2 text-center ${
        popup.type === "success"
          ? "bg-green-50 border-green-500 text-green-900"
          : "bg-red-50 border-red-500 text-red-900"
      }`}>
        <p className="font-semibold text-base">{popup.message}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [page, setPage] = useState("register");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [popup, setPopup] = useState<PopupType>({ show: false, message: "", type: "" });
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    confirmEmail: "",
    phone: "",
    countryCode: "+1",
    password: "",
    confirmPassword: "",
    referralCode: "",
    otp: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const refCode = params.get('ref');
    if (refCode) {
      setFormData(prev => ({...prev, referralCode: refCode}));
    }
  }, [search]);

  const countries = [
    { code: "+1", name: "USA", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+92", name: "Pakistan", flag: "🇵🇰" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+86", name: "China", flag: "🇨🇳" },
    { code: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+971", name: "UAE", flag: "🇦🇪" },
    { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
    { code: "+355", name: "Albania", flag: "🇦🇱" },
    { code: "+213", name: "Algeria", flag: "🇩🇿" },
    { code: "+376", name: "Andorra", flag: "🇦🇩" },
    { code: "+244", name: "Angola", flag: "🇦🇴" },
    { code: "+1268", name: "Antigua", flag: "🇦🇬" },
    { code: "+54", name: "Argentina", flag: "🇦🇷" },
    { code: "+374", name: "Armenia", flag: "🇦🇲" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+43", name: "Austria", flag: "🇦🇹" },
    { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
    { code: "+1242", name: "Bahamas", flag: "🇧🇸" },
    { code: "+973", name: "Bahrain", flag: "🇧🇭" },
    { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
    { code: "+1246", name: "Barbados", flag: "🇧🇧" },
    { code: "+375", name: "Belarus", flag: "🇧🇾" },
    { code: "+32", name: "Belgium", flag: "🇧🇪" },
    { code: "+501", name: "Belize", flag: "🇧🇿" },
    { code: "+229", name: "Benin", flag: "🇧🇯" },
    { code: "+975", name: "Bhutan", flag: "🇧🇹" },
    { code: "+591", name: "Bolivia", flag: "🇧🇴" },
    { code: "+387", name: "Bosnia", flag: "🇧🇦" },
    { code: "+267", name: "Botswana", flag: "🇧🇼" },
    { code: "+55", name: "Brazil", flag: "🇧🇷" },
    { code: "+673", name: "Brunei", flag: "🇧🇳" },
    { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
    { code: "+226", name: "Burkina Faso", flag: "🇧🇫" },
    { code: "+257", name: "Burundi", flag: "🇧🇮" },
    { code: "+855", name: "Cambodia", flag: "🇰🇭" },
    { code: "+237", name: "Cameroon", flag: "🇨🇲" },
    { code: "+238", name: "Cape Verde", flag: "🇨🇻" },
    { code: "+236", name: "CAR", flag: "🇨🇫" },
    { code: "+235", name: "Chad", flag: "🇹🇩" },
    { code: "+56", name: "Chile", flag: "🇨🇱" },
    { code: "+57", name: "Colombia", flag: "🇨🇴" },
    { code: "+269", name: "Comoros", flag: "🇰🇲" },
    { code: "+243", name: "Congo DR", flag: "🇨🇩" },
    { code: "+242", name: "Congo Rep", flag: "🇨🇬" },
    { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
    { code: "+385", name: "Croatia", flag: "🇭🇷" },
    { code: "+53", name: "Cuba", flag: "🇨🇺" },
    { code: "+357", name: "Cyprus", flag: "🇨🇾" },
    { code: "+420", name: "Czech", flag: "🇨🇿" },
    { code: "+45", name: "Denmark", flag: "🇩🇰" },
    { code: "+253", name: "Djibouti", flag: "🇩🇯" },
    { code: "+1767", name: "Dominica", flag: "🇩🇲" },
    { code: "+1809", name: "Dominican Rep", flag: "🇩🇴" },
    { code: "+670", name: "East Timor", flag: "🇹🇱" },
    { code: "+593", name: "Ecuador", flag: "🇪🇨" },
    { code: "+20", name: "Egypt", flag: "🇪🇬" },
    { code: "+503", name: "El Salvador", flag: "🇸🇻" },
    { code: "+240", name: "Eq. Guinea", flag: "🇬🇶" },
    { code: "+291", name: "Eritrea", flag: "🇪🇷" },
    { code: "+372", name: "Estonia", flag: "🇪🇪" },
    { code: "+268", name: "Eswatini", flag: "🇸🇿" },
    { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
    { code: "+679", name: "Fiji", flag: "🇫🇯" },
    { code: "+358", name: "Finland", flag: "🇫🇮" },
    { code: "+241", name: "Gabon", flag: "🇬🇦" },
    { code: "+220", name: "Gambia", flag: "🇬🇲" },
    { code: "+995", name: "Georgia", flag: "🇬🇪" },
    { code: "+233", name: "Ghana", flag: "🇬🇭" },
    { code: "+30", name: "Greece", flag: "🇬🇷" },
    { code: "+1473", name: "Grenada", flag: "🇬🇩" },
    { code: "+502", name: "Guatemala", flag: "🇬🇹" },
    { code: "+224", name: "Guinea", flag: "🇬🇳" },
    { code: "+245", name: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "+592", name: "Guyana", flag: "🇬🇾" },
    { code: "+509", name: "Haiti", flag: "🇭🇹" },
    { code: "+504", name: "Honduras", flag: "🇭🇳" },
    { code: "+852", name: "Hong Kong", flag: "🇭🇰" },
    { code: "+36", name: "Hungary", flag: "🇭🇺" },
    { code: "+354", name: "Iceland", flag: "🇮🇸" },
    { code: "+62", name: "Indonesia", flag: "🇮🇩" },
    { code: "+98", name: "Iran", flag: "🇮🇷" },
    { code: "+964", name: "Iraq", flag: "🇮🇶" },
    { code: "+353", name: "Ireland", flag: "🇮🇪" },
    { code: "+972", name: "Israel", flag: "🇮🇱" },
    { code: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "+1876", name: "Jamaica", flag: "🇯🇲" },
    { code: "+962", name: "Jordan", flag: "🇯🇴" },
    { code: "+7", name: "Kazakhstan", flag: "🇰🇿" },
    { code: "+254", name: "Kenya", flag: "🇰🇪" },
    { code: "+686", name: "Kiribati", flag: "🇰🇮" },
    { code: "+850", name: "North Korea", flag: "🇰🇵" },
    { code: "+82", name: "South Korea", flag: "🇰🇷" },
    { code: "+383", name: "Kosovo", flag: "🇽🇰" },
    { code: "+965", name: "Kuwait", flag: "🇰🇼" },
    { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
    { code: "+856", name: "Laos", flag: "🇱🇦" },
    { code: "+371", name: "Latvia", flag: "🇱🇻" },
    { code: "+961", name: "Lebanon", flag: "🇱🇧" },
    { code: "+266", name: "Lesotho", flag: "🇱🇸" },
    { code: "+231", name: "Liberia", flag: "🇱🇷" },
    { code: "+218", name: "Libya", flag: "🇱🇾" },
    { code: "+423", name: "Liechtenstein", flag: "🇱🇮" },
    { code: "+370", name: "Lithuania", flag: "🇱🇹" },
    { code: "+352", name: "Luxembourg", flag: "🇱🇺" },
    { code: "+853", name: "Macao", flag: "🇲🇴" },
    { code: "+261", name: "Madagascar", flag: "🇲🇬" },
    { code: "+265", name: "Malawi", flag: "🇲🇼" },
    { code: "+60", name: "Malaysia", flag: "🇲🇾" },
    { code: "+960", name: "Maldives", flag: "🇲🇻" },
    { code: "+223", name: "Mali", flag: "🇲🇱" },
    { code: "+356", name: "Malta", flag: "🇲🇹" },
    { code: "+692", name: "Marshall Islands", flag: "🇲🇭" },
    { code: "+222", name: "Mauritania", flag: "🇲🇷" },
    { code: "+230", name: "Mauritius", flag: "🇲🇺" },
    { code: "+52", name: "Mexico", flag: "🇲🇽" },
    { code: "+691", name: "Micronesia", flag: "🇫🇲" },
    { code: "+373", name: "Moldova", flag: "🇲🇩" },
    { code: "+377", name: "Monaco", flag: "🇲🇨" },
    { code: "+976", name: "Mongolia", flag: "🇲🇳" },
    { code: "+382", name: "Montenegro", flag: "🇲🇪" },
    { code: "+212", name: "Morocco", flag: "🇲🇦" },
    { code: "+258", name: "Mozambique", flag: "🇲🇿" },
    { code: "+95", name: "Myanmar", flag: "🇲🇲" },
    { code: "+264", name: "Namibia", flag: "🇳🇦" },
    { code: "+674", name: "Nauru", flag: "🇳🇷" },
    { code: "+977", name: "Nepal", flag: "🇳🇵" },
    { code: "+31", name: "Netherlands", flag: "🇳🇱" },
    { code: "+64", name: "New Zealand", flag: "🇳🇿" },
    { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
    { code: "+227", name: "Niger", flag: "🇳🇪" },
    { code: "+234", name: "Nigeria", flag: "🇳🇬" },
    { code: "+389", name: "North Macedonia", flag: "🇲🇰" },
    { code: "+47", name: "Norway", flag: "🇳🇴" },
    { code: "+968", name: "Oman", flag: "🇴🇲" },
    { code: "+680", name: "Palau", flag: "🇵🇼" },
    { code: "+507", name: "Panama", flag: "🇵🇦" },
    { code: "+675", name: "Papua New Guinea", flag: "🇵🇬" },
    { code: "+595", name: "Paraguay", flag: "🇵🇾" },
    { code: "+51", name: "Peru", flag: "🇵🇪" },
    { code: "+63", name: "Philippines", flag: "🇵🇭" },
    { code: "+48", name: "Poland", flag: "🇵🇱" },
    { code: "+351", name: "Portugal", flag: "🇵🇹" },
    { code: "+974", name: "Qatar", flag: "🇶🇦" },
    { code: "+40", name: "Romania", flag: "🇷🇴" },
    { code: "+7", name: "Russia", flag: "🇷🇺" },
    { code: "+250", name: "Rwanda", flag: "🇷🇼" },
    { code: "+1869", name: "Saint Kitts", flag: "🇰🇳" },
    { code: "+1758", name: "Saint Lucia", flag: "🇱🇨" },
    { code: "+1784", name: "Saint Vincent", flag: "🇻🇨" },
    { code: "+685", name: "Samoa", flag: "🇼🇸" },
    { code: "+378", name: "San Marino", flag: "🇸🇲" },
    { code: "+239", name: "Sao Tome", flag: "🇸🇹" },
    { code: "+221", name: "Senegal", flag: "🇸🇳" },
    { code: "+381", name: "Serbia", flag: "🇷🇸" },
    { code: "+248", name: "Seychelles", flag: "🇸🇨" },
    { code: "+232", name: "Sierra Leone", flag: "🇸🇱" },
    { code: "+65", name: "Singapore", flag: "🇸🇬" },
    { code: "+421", name: "Slovakia", flag: "🇸🇰" },
    { code: "+386", name: "Slovenia", flag: "🇸🇮" },
    { code: "+677", name: "Solomon Islands", flag: "🇸🇧" },
    { code: "+252", name: "Somalia", flag: "🇸🇴" },
    { code: "+27", name: "South Africa", flag: "🇿🇦" },
    { code: "+211", name: "South Sudan", flag: "🇸🇸" },
    { code: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
    { code: "+249", name: "Sudan", flag: "🇸🇩" },
    { code: "+597", name: "Suriname", flag: "🇸🇷" },
    { code: "+46", name: "Sweden", flag: "🇸🇪" },
    { code: "+41", name: "Switzerland", flag: "🇨🇭" },
    { code: "+963", name: "Syria", flag: "🇸🇾" },
    { code: "+886", name: "Taiwan", flag: "🇹🇼" },
    { code: "+992", name: "Tajikistan", flag: "🇹🇯" },
    { code: "+255", name: "Tanzania", flag: "🇹🇿" },
    { code: "+66", name: "Thailand", flag: "🇹🇭" },
    { code: "+228", name: "Togo", flag: "🇹🇬" },
    { code: "+676", name: "Tonga", flag: "🇹🇴" },
    { code: "+1868", name: "Trinidad", flag: "🇹🇹" },
    { code: "+216", name: "Tunisia", flag: "🇹🇳" },
    { code: "+90", name: "Turkey", flag: "🇹🇷" },
    { code: "+993", name: "Turkmenistan", flag: "🇹🇲" },
    { code: "+688", name: "Tuvalu", flag: "🇹🇻" },
    { code: "+256", name: "Uganda", flag: "🇺🇬" },
    { code: "+380", name: "Ukraine", flag: "🇺🇦" },
    { code: "+598", name: "Uruguay", flag: "🇺🇾" },
    { code: "+998", name: "Uzbekistan", flag: "🇺🇿" },
    { code: "+678", name: "Vanuatu", flag: "🇻🇺" },
    { code: "+379", name: "Vatican", flag: "🇻🇦" },
    { code: "+58", name: "Venezuela", flag: "🇻🇪" },
    { code: "+84", name: "Vietnam", flag: "🇻🇳" },
    { code: "+967", name: "Yemen", flag: "🇾🇪" },
    { code: "+260", name: "Zambia", flag: "🇿🇲" },
    { code: "+263", name: "Zimbabwe", flag: "🇿🇼" },
  ];

  const showPopup = (message: string, type = "error") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email !== formData.confirmEmail) {
      showPopup("Email Not Match", "error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showPopup("Password Not Match", "error");
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
      showPopup("Email Sent", "success");
    } else {
      showPopup("wrong", "error");
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
      showPopup("SignUp Successful", "success");
      setTimeout(() => setPage("login"), 1500);
    } else {
      showPopup("Code ghalat hai ya expire ho gaya hai", "error");
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
      showPopup("Wrong Password or Wrong Email", "error");
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
      showPopup("Password reset link aapke email pe bhej di gayi", "success");
      setTimeout(() => setPage("login"), 2000);
    } else {
      showPopup("Reset link nahi bheja ja saka", "error");
    }
  };

  const inputClass = "w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none text-base";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #d1fae5 100%)'}}>
      <Popup popup={popup} />

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 rounded-xl object-cover" />
          <h1 className="text-3xl font-bold text-slate-900">THE SUPER NFT</h1>
          <p className="text-green-600 text-sm mt-1 font-medium">Welcome to Community World</p>
        </div>

        {page === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className={inputClass} required />
            <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={inputClass} required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} required />
            <input type="email" placeholder="Confirm Email" value={formData.confirmEmail} onChange={(e) => setFormData({...formData, confirmEmail: e.target.value})} className={inputClass} required />
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                className="w-24 bg-slate-50 text-slate-900 px-2 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none text-sm"
              >
                {countries.map(c => (
                  <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="flex-1 bg-slate-50 text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 outline-none text-base" required />
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={inputClass} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={inputClass} required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <input type="text" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={(e) => setFormData({...formData, referralCode: e.target.value})} className={inputClass} />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base">
              {loading ? "Processing..." : "Register Now"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have account?{" "}
              <button type="button" onClick={() => setPage("login")} className="text-green-600 font-semibold">Login Accounts</button>
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
              className={`${inputClass} text-center text-2xl tracking-widest`}
              required
            />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base">
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button type="button" onClick={() => setPage("register")} className="w-full text-slate-500 text-sm hover:text-slate-700">
              Back to Register
            </button>
          </form>
        )}

        {page === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} required />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={inputClass} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setPage("forgot")} className="text-sm text-green-600 hover:text-green-700">Forgot Password?</button>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base">
              {loading ? "Logging In..." : "Login Accounts"}
            </button>
            <p className="text-center text-sm text-slate-600">
              Don't have account?{" "}
              <button type="button" onClick={() => setPage("register")} className="text-green-600 font-semibold">Register Now</button>
            </p>
          </form>
        )}

        {page === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-slate-600 text-sm text-center">Enter your email to reset password</p>
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} required />
            <button type="submit" disabled={loading} className="w-full btn-green py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 text-base">
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
