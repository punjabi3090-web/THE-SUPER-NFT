import { useLocation } from "wouter";
import { Users, Trophy, FileText, Share2, User, FileCheck, Send, Settings, Hammer, Bookmark } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE, useBalance } from "../App";

export default function Home() {
  const [, setLocation] = useLocation();
  const { balance } = useBalance();

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Wallet Balance Card — no deposit/withdraw buttons */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <p className="text-sm opacity-90">Wallet Balance (USDT)</p>
        <h1 className="text-3xl font-bold mt-1">${balance.toFixed(2)}</h1>
        <p style={{ fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 }}>Level-0</p>
      </div>

      {/* My Team */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">My Team</h3>
        <div className="grid grid-cols-4 text-center gap-2 mb-4">
          {[
            { val: testUser.team.rewards, label: "Community rewards" },
            { val: testUser.team.valid, label: "Valid Members" },
            { val: testUser.team.a, label: "A enthusiast" },
            { val: testUser.team.bc, label: "B+C enthusiasts" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold text-slate-800">{item.val}</p>
              <p className="text-gray-400 text-xs leading-tight mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 text-center gap-2">
          <button onClick={() => console.log('enthusiasts')} className="flex flex-col items-center gap-1">
            <Users className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community enthusiasts</p>
          </button>
          <button onClick={() => console.log('contributions')} className="flex flex-col items-center gap-1">
            <Trophy className="text-yellow-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community contributions</p>
          </button>
          <button onClick={() => console.log('orders')} className="flex flex-col items-center gap-1">
            <FileText className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Community orders</p>
          </button>
          <button onClick={() => console.log('referral')} className="flex flex-col items-center gap-1">
            <Share2 className="text-green-400" size={24} />
            <p className="text-xs text-gray-500 leading-tight">Referral</p>
          </button>
        </div>
      </div>

      {/* My Orders — only My Bid + Details, no deposit/withdraw */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">My Orders</h3>
          <button onClick={() => console.log('check orders')} className="text-sm text-gray-400">Check Orders &gt;</button>
        </div>
        <div className="grid grid-cols-4 text-center gap-2 mb-4">
          {[
            { val: testUser.orders.total, label: "Orders" },
            { val: testUser.orders.processing, label: "Processing" },
            { val: testUser.orders.bought, label: "Bought" },
            { val: testUser.orders.sold, label: "Sold" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-lg font-bold text-slate-800">{item.val}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 text-center gap-2">
          <button onClick={() => console.log('bid')} className="flex flex-col items-center gap-1">
            <User className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">My Bid</p>
          </button>
          <button onClick={() => console.log('details')} className="flex flex-col items-center gap-1">
            <FileCheck className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">Details</p>
          </button>
        </div>
      </div>

      {/* Common Functions */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">Common Functions</h2>
        <div className="border-t border-gray-100 my-3"></div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <button onClick={() => { console.log('Tutorials'); setLocation('/tutorials'); }} className="flex flex-col items-center gap-2 py-2 active:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center">
              <Send size={20} className="text-cyan-500" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-gray-600">Tutorials</span>
          </button>
          <button onClick={() => setLocation('/my')} className="flex flex-col items-center gap-2 py-2 active:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-blue-500" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-gray-600">Settings</span>
          </button>
          <button onClick={() => setLocation('/reserve')} className="flex flex-col items-center gap-2 py-2 active:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <Hammer size={20} className="text-teal-500" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-gray-600">Mint</span>
          </button>
          <button onClick={() => setLocation('/assets')} className="flex flex-col items-center gap-2 py-2 active:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <Bookmark size={20} className="text-purple-500" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-gray-600">Collection</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
