import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setToken(t);
    else setMsg("Invalid or missing reset token.");
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setMsg("Password must be at least 6 characters"); return; }
    if (password !== confirm)  { setMsg("Passwords do not match"); return; }
    if (!token)                { setMsg("Invalid reset token"); return; }

    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/nft/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Reset failed"); setStatus("error"); }
      else          { setStatus("success"); }
    } catch {
      setMsg("Network error. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-white text-[#1E293B] px-4 py-3 rounded-lg border border-[#BFDBFE] focus:border-[#1E3A8A] outline-none text-base placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="w-14 h-14 mx-auto mb-3 rounded-xl object-cover" />
          <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1">THE SUPER NFT</p>
        </div>

        {status === "success" ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle size={48} className="text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-lg">Password Reset!</p>
            <p className="text-sm text-slate-500">Your password has been updated successfully.</p>
            <button onClick={() => setLocation('/login')}
              className="w-full py-3 rounded-xl text-white font-bold" style={{ background: '#1E3A8A' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <input type={showPw ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="New password (min 6 chars)" className={inp} required />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm new password" className={inp} required />

            {msg && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !token}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50" style={{ background: '#1E3A8A' }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button type="button" onClick={() => setLocation('/login')}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
