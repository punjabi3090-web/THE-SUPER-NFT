import { ArrowLeft, MessageCircle, Send, Mail, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../App";

const channels = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    desc: "Chat with support on WhatsApp",
    color: "from-green-400 to-emerald-500",
    href: "https://wa.me/1234567890",
    tag: "Fastest",
    tagColor: "bg-green-100 text-green-700",
  },
  {
    icon: Send,
    label: "Telegram",
    desc: "Join our official Telegram group",
    color: "from-blue-400 to-cyan-500",
    href: "https://t.me/thesupernft",
    tag: "Community",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: Mail,
    label: "Email Support",
    desc: "support@thesupernft.com",
    color: "from-purple-400 to-pink-500",
    href: "mailto:support@thesupernft.com",
    tag: "24–48h",
    tagColor: "bg-purple-100 text-purple-700",
  },
];

const faqs = [
  { q: "How long does deposit take?", a: "TRC20 deposits confirm within 1–3 minutes after network confirmation." },
  { q: "Minimum withdrawal amount?", a: "Minimum withdrawal is $10 USDT. Network fee is $1 USDT." },
  { q: "How do I reset my password?", a: "Use Forgot Password on the login page. An OTP will be sent to your email." },
  { q: "How does referral commission work?", a: "You earn 5% from Level 1, 3% from Level 2, and 1% from Level 3 referrals." },
];

export default function Service() {
  const [, setLocation] = useLocation();

  const handleContact = (href: string, label: string) => {
    console.log('contact clicked', label);
    window.open(href, '_blank');
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => { console.log('back from service'); setLocation('/my'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Customer Service</h1>
      </div>

      {/* Contact Channels */}
      <div className="px-4 mt-4 space-y-3">
        {channels.map(ch => {
          const Icon = ch.icon;
          return (
            <button
              key={ch.label}
              onClick={() => handleContact(ch.href, ch.label)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ch.color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={24} className="text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800">{ch.label}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.tagColor}`}>{ch.tag}</span>
                </div>
                <p className="text-xs text-slate-400">{ch.desc}</p>
              </div>
              <ExternalLink size={16} className="text-slate-300 flex-shrink-0" />
            </button>
          );
        })}
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
