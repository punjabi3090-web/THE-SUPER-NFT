import { ArrowLeft, Download, Lock, Users, Shield, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { TEST_MODE } from "../lib/testData";

const guides = [
  {
    icon: Download,
    color: "from-emerald-100 to-teal-100",
    iconColor: "text-emerald-600",
    title: "Deposit Guide",
    desc: "How to deposit USDT to your wallet",
    steps: [
      "Go to Assets page and tap Deposit",
      "Select your preferred network (TRC20 / ERC20 / BEP20)",
      "Copy the deposit address or scan the QR code",
      "Send USDT from your external wallet to this address",
      "Balance updates automatically after confirmation",
    ],
  },
  {
    icon: Lock,
    color: "from-blue-100 to-indigo-100",
    iconColor: "text-blue-600",
    title: "Reserve NFT",
    desc: "How to reserve and hold NFTs",
    steps: [
      "Go to the Reserve page from the bottom nav",
      "Browse available NFT collections",
      "Select an NFT and tap Reserve",
      "Confirm the reservation with your balance",
      "Reserved NFTs appear in your Assets",
    ],
  },
  {
    icon: Users,
    color: "from-purple-100 to-pink-100",
    iconColor: "text-purple-600",
    title: "Refer Friends",
    desc: "Earn commissions by inviting friends",
    steps: [
      "Go to My page and find your referral link",
      "Share your unique invite link with friends",
      "Friends register using your referral code",
      "Earn Level 1 (5%), Level 2 (3%), Level 3 (1%)",
      "Commissions credited instantly to your balance",
    ],
  },
  {
    icon: Shield,
    color: "from-orange-100 to-red-100",
    iconColor: "text-orange-600",
    title: "Safety Tips",
    desc: "Keep your account and funds safe",
    steps: [
      "Never share your password or OTP with anyone",
      "Only use official THE SUPER NFT links",
      "Always verify wallet addresses before sending",
      "Enable 2FA from Security settings",
      "Contact support if you notice suspicious activity",
    ],
  },
];

export default function Tutorials() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 pb-8">
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => { console.log('back from tutorials'); setLocation('/'); }} className="text-slate-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Tutorials</h1>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {guides.map(g => {
          const Icon = g.icon;
          return (
            <details key={g.title} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
              <summary className="flex items-center gap-3 px-4 py-4 cursor-pointer list-none select-none">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={g.iconColor} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{g.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 border-t border-slate-50">
                <ol className="mt-3 space-y-2">
                  {g.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
