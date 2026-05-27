import { useState } from "react";
import {
  Home,
  Shield,
  TrendingUp,
  Wallet,
  User,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  LogOut,
  Copy,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";

const user = {
  name: "Khadim Jamali",
  username: "@khadimjamali",
  email: "khadimjamali906@gmail.com",
  phone: "+92 300 1234567",
  joined: "January 2024",
  avatar: "KJ",
};

const transactions = [
  { id: 1, type: "receive", label: "Received from Ali", amount: "+$240.00", date: "Today, 2:30 PM", coin: "ETH" },
  { id: 2, type: "send", label: "Sent to Usman", amount: "-$85.00", date: "Today, 11:00 AM", coin: "USDT" },
  { id: 3, type: "receive", label: "Staking Reward", amount: "+$12.50", date: "Yesterday", coin: "BNB" },
  { id: 4, type: "send", label: "NFT Purchase", amount: "-$320.00", date: "May 24", coin: "ETH" },
  { id: 5, type: "receive", label: "Referral Bonus", amount: "+$50.00", date: "May 22", coin: "USDT" },
];

const stakingPools = [
  { id: 1, name: "ETH 2.0 Pool", apy: "4.8%", locked: "$1,200", duration: "30 days", status: "Active", color: "from-blue-500 to-indigo-600" },
  { id: 2, name: "BNB Flexible", apy: "6.2%", locked: "$450", duration: "Flexible", status: "Active", color: "from-yellow-400 to-orange-500" },
  { id: 3, name: "USDT Stable", apy: "9.5%", locked: "$800", duration: "90 days", status: "Locked", color: "from-green-400 to-teal-500" },
  { id: 4, name: "SOL Growth", apy: "12.1%", locked: "$0", duration: "60 days", status: "Available", color: "from-purple-500 to-fuchsia-600" },
];

const assets = [
  { id: 1, name: "Ethereum", symbol: "ETH", balance: "1.42", value: "$4,260", change: "+3.2%", up: true, color: "bg-blue-100", logo: "Ξ" },
  { id: 2, name: "BNB Chain", symbol: "BNB", balance: "5.80", value: "$1,740", change: "+1.8%", up: true, color: "bg-yellow-100", logo: "B" },
  { id: 3, name: "Tether", symbol: "USDT", balance: "830.00", value: "$830", change: "0.0%", up: true, color: "bg-green-100", logo: "$" },
  { id: 4, name: "Solana", symbol: "SOL", balance: "3.25", value: "$520", change: "-2.1%", up: false, color: "bg-purple-100", logo: "◎" },
];

const nfts = [
  { id: 1, name: "CryptoPunk #4821", collection: "CryptoPunks", value: "$1,200", color: "from-pink-400 to-rose-500" },
  { id: 2, name: "Bored Ape #7734", collection: "BAYC", value: "$8,500", color: "from-orange-400 to-amber-500" },
  { id: 3, name: "Azuki #2291", collection: "Azuki", value: "$3,100", color: "from-red-400 to-pink-500" },
];

function HomeTab() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-sm text-white/70 mb-1">Total Portfolio Balance</p>
        <h2 className="text-4xl font-bold tracking-tight">$7,350.00</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ArrowUpRight size={12} /> +$214.50 (3.0%) today
          </span>
        </div>
        <div className="flex gap-4 mt-6">
          <button className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowUpRight size={16} /> Send
          </button>
          <button className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowDownLeft size={16} /> Receive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "ETH", value: "$4,260", change: "+3.2%", up: true },
          { label: "BNB", value: "$1,740", change: "+1.8%", up: true },
          { label: "USDT", value: "$830", change: "0.0%", up: true },
        ].map((coin) => (
          <div key={coin.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400">{coin.label}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{coin.value}</p>
            <p className={`text-xs mt-0.5 ${coin.up ? "text-green-500" : "text-red-500"}`}>{coin.change}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
          <button className="text-xs text-indigo-600 hover:underline">See all</button>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "receive" ? "bg-green-100" : "bg-red-100"
              }`}>
                {tx.type === "receive"
                  ? <ArrowDownLeft size={18} className="text-green-600" />
                  : <ArrowUpRight size={18} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.label}</p>
                <p className="text-xs text-gray-400">{tx.date} · {tx.coin}</p>
              </div>
              <span className={`text-sm font-semibold ${
                tx.type === "receive" ? "text-green-600" : "text-red-500"
              }`}>{tx.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReserveTab() {
  const [locked, setLocked] = useState(false);
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleToggle = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setConfirmed(true);
    setTimeout(() => {
      setLocked(!locked);
      setConfirmed(false);
      setAmount("");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reserve</h1>
        <p className="text-sm text-gray-500 mt-1">Lock your assets to earn guaranteed returns</p>
      </div>

      <div className={`rounded-2xl p-6 text-white shadow-xl ${locked
        ? "bg-gradient-to-br from-rose-500 to-pink-600"
        : "bg-gradient-to-br from-indigo-500 to-purple-600"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Reserve Status</p>
            <p className="text-2xl font-bold mt-1">{locked ? "🔒 Locked" : "🔓 Unlocked"}</p>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            locked ? "bg-white/20" : "bg-white/20"
          }`}>
            {locked ? <Lock size={28} /> : <Unlock size={28} />}
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl p-3">
          <p className="text-xs text-white/60">Locked Amount</p>
          <p className="text-xl font-bold">{locked ? `$${amount}` : "$0.00"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">{locked ? "Unlock Your Reserve" : "Lock Your Reserve"}</h3>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Amount (USD)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={() => setAmount("1000")}
              className="text-xs text-indigo-600 border border-indigo-200 px-3 rounded-xl hover:bg-indigo-50"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["30 Days", "60 Days", "90 Days"].map((d) => (
            <button key={d} className="border border-gray-200 rounded-xl py-2 text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={handleToggle}
          disabled={!amount || confirmed}
          className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
            locked
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          }`}
        >
          {confirmed ? (
            <><CheckCircle2 size={18} /> Confirmed!</>
          ) : locked ? (
            <><Unlock size={18} /> Unlock Reserve</>
          ) : (
            <><Lock size={18} /> Lock Reserve</>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Reserve Benefits</h3>
        <div className="space-y-3">
          {[
            { label: "Base APY", value: "8.5%" },
            { label: "Bonus Reward", value: "+2.0%" },
            { label: "Lock Period", value: "30–90 days" },
            { label: "Min. Amount", value: "$50" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StakeTab() {
  const [staked, setStaked] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stake</h1>
        <p className="text-sm text-gray-500 mt-1">Earn passive income by staking your crypto</p>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-white/70 text-sm">Total Staked Value</p>
        <p className="text-3xl font-bold mt-1">$2,450.00</p>
        <div className="flex gap-4 mt-3 text-sm">
          <div><span className="text-white/60">Rewards</span><p className="font-semibold">$148.20</p></div>
          <div><span className="text-white/60">Avg APY</span><p className="font-semibold">7.3%</p></div>
          <div><span className="text-white/60">Active Pools</span><p className="font-semibold">3</p></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Staking Pools</h3>
        {stakingPools.map((pool) => (
          <div key={pool.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`h-1.5 w-full bg-gradient-to-r ${pool.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{pool.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pool.duration}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  pool.status === "Active" ? "bg-green-100 text-green-700" :
                  pool.status === "Locked" ? "bg-amber-100 text-amber-700" :
                  "bg-indigo-100 text-indigo-700"
                }`}>{pool.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <div><p className="text-gray-400 text-xs">APY</p><p className="font-bold text-green-600">{pool.apy}</p></div>
                  <div><p className="text-gray-400 text-xs">Locked</p><p className="font-bold text-gray-800">{pool.locked}</p></div>
                </div>
                <button
                  onClick={() => setStaked(staked === pool.id ? null : pool.id)}
                  className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all ${
                    staked === pool.id
                      ? "bg-gray-100 text-gray-600"
                      : `bg-gradient-to-r ${pool.color} text-white shadow-sm`
                  }`}
                >
                  {staked === pool.id ? "Unstake" : pool.status === "Available" ? "Stake Now" : "Add More"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetTab() {
  const [copied, setCopied] = useState(false);
  const address = "0x4e8A...9b3F";

  const copyAddress = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Assets</h1>
        <p className="text-sm text-gray-500 mt-1">Your tokens and NFT collection</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <Wallet size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Wallet Address</p>
          <p className="text-sm font-mono text-gray-700 truncate">{address}</p>
        </div>
        <button onClick={copyAddress} className="text-indigo-600 hover:text-indigo-800 transition-colors">
          {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
        </button>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Tokens</h3>
        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 px-5 py-4">
              <div className={`w-10 h-10 rounded-full ${asset.color} flex items-center justify-center text-lg font-bold`}>
                {asset.logo}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{asset.name}</p>
                <p className="text-xs text-gray-400">{asset.balance} {asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 text-sm">{asset.value}</p>
                <p className={`text-xs ${asset.up ? "text-green-500" : "text-red-500"}`}>{asset.change}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">NFTs</h3>
        <div className="grid grid-cols-2 gap-4">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`h-28 bg-gradient-to-br ${nft.color} flex items-center justify-center text-4xl`}>🖼</div>
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-800 truncate">{nft.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{nft.collection}</p>
                <p className="text-xs font-bold text-indigo-600 mt-1">{nft.value}</p>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-40 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-300 hover:text-indigo-400 transition-colors">
            <span className="text-2xl">＋</span>
            <span className="text-xs mt-1">Add NFT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {editing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-inner">
          {user.avatar}
        </div>
        <div>
          <p className="text-xl font-bold">{user.name}</p>
          <p className="text-white/70 text-sm">{user.username}</p>
          <p className="text-white/50 text-xs mt-1">Member since {user.joined}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {[
          { label: "Full Name", value: user.name },
          { label: "Username", value: user.username },
          { label: "Email", value: user.email },
          { label: "Phone", value: user.phone },
        ].map((field) => (
          <div key={field.label} className="flex items-center px-6 py-4 gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400">{field.label}</p>
              {editing ? (
                <input
                  defaultValue={field.value}
                  className="text-sm text-gray-800 font-medium border-b border-indigo-300 focus:outline-none w-full mt-1 pb-0.5"
                />
              ) : (
                <p className="text-sm text-gray-800 font-medium mt-0.5">{field.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h3 className="font-semibold text-gray-800 mb-2">Security</h3>
        {["Change Password", "Two-Factor Authentication", "Connected Devices"].map((item) => (
          <button key={item} className="w-full flex items-center justify-between py-3 text-sm text-gray-700 hover:text-indigo-600 transition-colors border-b border-gray-50 last:border-0">
            <span>{item}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>

      <button
        onClick={() => setLocation("/login")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors border border-red-100"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "reserve", label: "Reserve", icon: Shield },
    { id: "stake", label: "Stake", icon: TrendingUp },
    { id: "asset", label: "Asset", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <HomeTab />;
      case "reserve": return <ReserveTab />;
      case "stake": return <StakeTab />;
      case "asset": return <AssetTab />;
      case "profile": return <ProfileTab />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 flex flex-col`}>
        <div className="px-6 py-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <h2 className="text-lg font-bold text-gray-800">SecureEntry</h2>
          </div>
        </div>
        <nav className="mt-4 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center px-5 py-3.5 text-left transition-all mx-2 rounded-xl mb-1 ${
                  activeTab === item.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={{ width: "calc(100% - 16px)" }}
              >
                <Icon size={19} className={`mr-3 ${activeTab === item.id ? "text-indigo-600" : "text-gray-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 text-center">v1.0.0 · Secure Entry</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto lg:max-w-2xl">
        {renderContent()}
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
