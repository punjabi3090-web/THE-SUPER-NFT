import { useLocation } from "wouter";
import { Users, Trophy, FileText, Share2, User, FileCheck, Download, Upload } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE } from "../App";

export default function Stake() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-28 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Stake Card */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span className="font-semibold text-slate-700">Stake</span>
          <div className="flex gap-6 text-xs">
            <span>🎁 0</span>
            <span>🎁 0</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">No staking positions yet</p>
          <button
            onClick={() => console.log('start staking')}
            className="mt-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold px-6 py-2 rounded-full"
          >
            Start Staking
          </button>
        </div>
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
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users className="text-blue-400" size={20} /></div>
            <p className="text-xs text-gray-500 leading-tight">Community enthusiasts</p>
          </button>
          <button onClick={() => console.log('contributions')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center"><Trophy className="text-yellow-400" size={20} /></div>
            <p className="text-xs text-gray-500 leading-tight">Community contributions</p>
          </button>
          <button onClick={() => console.log('orders')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FileText className="text-blue-400" size={20} /></div>
            <p className="text-xs text-gray-500 leading-tight">Community orders</p>
          </button>
          <button onClick={() => console.log('referral')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><Share2 className="text-green-400" size={20} /></div>
            <p className="text-xs text-gray-500 leading-tight">Referral</p>
          </button>
        </div>
      </div>

      {/* My Orders */}
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
        <div className="grid grid-cols-4 text-center gap-2">
          <button onClick={() => console.log('bid')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><User className="text-blue-400" size={20} /></div>
            <p className="text-xs text-gray-500">My Bid</p>
          </button>
          <button onClick={() => console.log('details')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FileCheck className="text-blue-400" size={20} /></div>
            <p className="text-xs text-gray-500">Details</p>
          </button>
          <button onClick={() => setLocation('/deposit')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><Download className="text-green-500" size={20} /></div>
            <p className="text-xs text-gray-500">Deposit</p>
          </button>
          <button onClick={() => setLocation('/withdraw')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Upload className="text-purple-500" size={20} /></div>
            <p className="text-xs text-gray-500">Withdraw</p>
          </button>
        </div>
      </div>

      {/* Common Functions */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-slate-800">Common Functions</h3>
        <div className="grid grid-cols-4 text-center gap-2">
          <button onClick={() => console.log('tutorials')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">✈️</div>
            <p className="text-xs text-gray-500">Tutorials</p>
          </button>
          <button onClick={() => console.log('settings')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">⚙️</div>
            <p className="text-xs text-gray-500">Settings</p>
          </button>
          <button onClick={() => console.log('mint')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-blue-500 text-lg">T</div>
            <p className="text-xs text-gray-500">Mint</p>
          </button>
          <button onClick={() => console.log('collection')} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🔖</div>
            <p className="text-xs text-gray-500">Collection</p>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
