import { useLocation } from "wouter";
import { Users, Trophy, FileText, Share2, User, FileCheck, Download, Upload, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { testUser, TEST_MODE } from "../App";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-20 max-w-md mx-auto">
      <Header />
      {TEST_MODE && <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1 font-medium">🧪 Test Mode</div>}

      {/* Wallet Balance Card */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <p className="text-sm opacity-90">Wallet Balance (USDT)</p>
        <h1 className="text-3xl font-bold mt-1">${testUser.balance.toFixed(2)}</h1>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { console.log('deposit clicked'); setLocation('/deposit'); }}
            className="flex-1 bg-white/20 backdrop-blur-sm py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowDownCircle size={17} /> Deposit
          </button>
          <button
            onClick={() => { console.log('withdraw clicked'); setLocation('/withdraw'); }}
            className="flex-1 bg-white/20 backdrop-blur-sm py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <ArrowUpCircle size={17} /> Withdraw
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
            <User className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">My Bid</p>
          </button>
          <button onClick={() => console.log('details')} className="flex flex-col items-center gap-1">
            <FileCheck className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">Details</p>
          </button>
          <button onClick={() => { console.log('deposit'); setLocation('/deposit'); }} className="flex flex-col items-center gap-1">
            <Download className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">Deposit</p>
          </button>
          <button onClick={() => { console.log('withdraw'); setLocation('/withdraw'); }} className="flex flex-col items-center gap-1">
            <Upload className="text-blue-400" size={24} />
            <p className="text-xs text-gray-500">Withdraw</p>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
