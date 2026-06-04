import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const BRAND = { red: "#DC2626", blue: "#1E3A8A", bg: "#F8F9FA" };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BRAND.bg }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm border border-gray-100">

        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        {sent ? (
          /* Success state */
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#F0FDF4" }}
            >
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.blue }}>Check Your Email</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              We've sent a password reset link to <br />
              <span className="font-semibold" style={{ color: BRAND.blue }}>{email}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: BRAND.red }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-2"
              style={{ color: BRAND.blue }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#EFF6FF" }}
              >
                <Mail size={24} style={{ color: BRAND.blue }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND.blue }}>Forgot Password?</h1>
              <p className="text-sm text-gray-400 mt-1">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your registered email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-white text-gray-800 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] outline-none text-sm"
                required
                autoFocus
              />

              {error && (
                <div className="rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
                style={{ background: BRAND.red }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
