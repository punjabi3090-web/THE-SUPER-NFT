import { ArrowLeft, Send, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../lib/testData";

const faqs = [
  { q: "How long does deposit take?", a: "TRC20 deposits confirm within 1–3 minutes after network confirmation." },
  { q: "Minimum withdrawal amount?", a: "Minimum withdrawal is $10 USDT. Network fee is $1 USDT." },
  { q: "How do I reset my password?", a: "Use Forgot Password on the login page. An OTP will be sent to your email." },
  { q: "How does referral commission work?", a: "You earn 5% from Level 1, 3% from Level 2, and 1% from Level 3 referrals." },
];

export default function Service() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => setLocation('/my')} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Customer Service</h1>
      </div>

      {/* Telegram only */}
      <div className="px-4 mt-4">
        <button
          onClick={() => window.open('https://t.me/thesupernft', '_blank')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Send size={24} className="text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-slate-800">Telegram Support</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Community</span>
            </div>
            <p className="text-xs text-slate-400">Join our official Telegram group</p>
          </div>
          <ExternalLink size={16} className="text-slate-300 flex-shrink-0" />
        </button>
      </div>

      {/* FAQs */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-slate-800 mb-3">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
              <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none">
                <span className="text-sm font-medium text-slate-700">{faq.q}</span>
                <span className="text-slate-300 text-lg group-open:rotate-45 transition-transform inline-block ml-2">+</span>
              </summary>
              <div className="px-4 pb-4 border-t border-slate-50">
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
