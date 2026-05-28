import { useLocation } from "wouter";
import { Bell, Wallet, ArrowDownCircle, ArrowUpCircle, Users, Share2 } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { testUser, testNFTs, TEST_MODE } from "../App";

export default function Home() {
  const [, setLocation] = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null') || testUser;

  return (
    <div className="min-h-screen pb-20" style={{background: '#f9fafb', maxWidth: '448px', margin: '0 auto'}}>
      {TEST_MODE && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🧪 Test Mode</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-slate-800 text-base">THE SUPER NFT</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => console.log('bell clicked')} className="text-slate-500">
            <Bell size={22} />
          </button>
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {(user?.fullName || user?.name || "U")[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 rounded-2xl p-5 text-white shadow-lg mb-4" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
        <p className="text-sm opacity-80 mb-1">Total Balance</p>
        <h2 className="text-3xl font-bold mb-4">${testUser.balance.toFixed(2)}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => { console.log('deposit clicked'); setLocation('/deposit'); }}
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <ArrowDownCircle size={16} /> Deposit
          </button>
          <button
            onClick={() => { console.log('withdraw clicked'); setLocation('/withdraw'); }}
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <ArrowUpCircle size={16} /> Withdraw
          </button>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mx-4 grid grid-cols-4 gap-3 mb-5">
        {[
          { icon: ArrowDownCircle, label: "Recharge", path: "/deposit", color: "bg-emerald-100 text-emerald-600" },
          { icon: ArrowUpCircle, label: "Withdraw", path: "/withdraw", color: "bg-blue-100 text-blue-600" },
          { icon: Users, label: "Team", path: "/team", color: "bg-purple-100 text-purple-600" },
          { icon: Share2, label: "Invite", path: "/team", color: "bg-orange-100 text-orange-600" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => { console.log(`${item.label} clicked`); setLocation(item.path); }}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl py-3 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="text-xs text-slate-600 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hot NFTs */}
      <div className="mx-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">🔥 Hot NFTs</h3>
          <button onClick={() => setLocation('/market')} className="text-xs text-emerald-600 font-medium">See All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {testNFTs.map(nft => (
            <div key={nft.id} className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative">
                <img src={nft.img} alt={nft.name} className="w-full h-28 object-cover" />
                <span className="absolute top-1 right-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{nft.profit}</span>
                <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{nft.level}</span>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-800 truncate">{nft.name}</p>
                <p className="text-emerald-600 font-bold text-sm">${nft.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Commission */}
      <div className="mx-4 mb-5">
        <h3 className="font-bold text-slate-800 mb-3">👥 Team Commission</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { level: "Level 1", members: 5, rate: "5%" },
            { level: "Level 2", members: 12, rate: "3%" },
            { level: "Level 3", members: 8, rate: "1%" },
          ].map(t => (
            <div key={t.level} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{t.level}</p>
              <p className="text-lg font-bold text-slate-800">{t.members}</p>
              <p className="text-xs text-emerald-600 font-semibold">{t.rate}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
