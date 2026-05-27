import { useState } from "react";
import { Home, TrendingUp, Shield, Wallet, User, Bell, Menu, HelpCircle, Users, Trophy, FileText, Share2, UserCheck, FileSearch, Download, Upload, BookOpen, Settings, Coins, Star } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");

  const bottomMenu = [
    { id: "stake", label: "Stake", icon: TrendingUp },
    { id: "earn", label: "Earn", icon: Coins },
    { id: "reserve", label: "Reserve", icon: Shield },
    { id: "assets", label: "Assets", icon: Wallet },
    { id: "my", label: "My", icon: User },
  ];

  const renderHome = () => (
    <div className="pb-24 px-4">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg"></div>
          <span className="font-bold text-lg">Treasure Fun</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell size={20} />
          <span className="text-sm text-blue-500">Airdrop</span>
          <Menu size={20} />
        </div>
      </div>

      {/* Profile Section */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full"></div>
          <div>
            <div className="text-sm text-gray-500">UID:</div>
            <div className="flex gap-2 mt-1">
              <span className="px-3 py-1 bg-white rounded-full text-xs border">Level 0 &gt;</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs border">0 Points &gt;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="card p-4 mb-4">
        <div className="text-sm text-gray-500 mb-2">Wallet Balance</div>
        <div className="flex items-center gap-2 text-2xl font-bold mb-1">
          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs">T</div>
          0
        </div>
        <div className="text-sm text-gray-500 mt-3 mb-1">TUFTWallet Balance</div>
        <div className="text-2xl font-bold text-gray-800">875,045.29</div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 text-sm mb-2">
            <div></div>
            <div className="text-gray-500 text-center">Daily income</div>
            <div className="text-gray-500 text-right">Total income</div>
          </div>
          {[
            { name: "Comprehensive", daily: "0", total: "866,918" },
            { name: "Reserve", daily: "0", total: "3.4" },
            { name: "Team", daily: "0", total: "0" },
            { name: "Activity", daily: "0", total: "0" },
            { name: "Bid", daily: "0", total: "0" },
          ].map((item) => (
            <div key={item.name} className="grid grid-cols-3 py-2 text-sm">
              <div className="flex items-center gap-1">
                {item.name}
                <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-[10px]">T</div>
                {item.daily}
              </div>
              <div></div>
              <div className="flex items-center justify-end gap-1">
                <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-[10px]">T</div>
                {item.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Team Card */}
      <div className="card p-4 mb-4">
        <div className="font-semibold mb-3">My Team</div>
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div>
            <div className="font-bold text-lg">0</div>
            <div className="text-[10px] text-gray-500">Community rewards</div>
          </div>
          <div>
            <div className="font-bold text-lg">0</div>
            <div className="text-[10px] text-gray-500">Valid Members</div>
          </div>
          <div>
            <div className="font-bold text-lg">0</div>
            <div className="text-[10px] text-gray-500">A enthusiast</div>
          </div>
          <div>
            <div className="font-bold text-lg">0</div>
            <div className="text-[10px] text-gray-500">B+C enthusiasts</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Users, label: "Community enthusiasts" },
            { icon: Trophy, label: "Community contributions" },
            { icon: FileText, label: "Community orders" },
            { icon: Share2, label: "Referral" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <item.icon size={24} className="text-cyan-500" />
              <span className="text-[9px] text-center text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* My Orders Card */}
      <div className="card p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold">My Orders</span>
          <span className="text-xs text-gray-500">Check Orders &gt;</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {[
            { label: "Orders", val: "0" },
            { label: "Processing", val: "0" },
            { label: "Bought", val: "0" },
            { label: "Sold", val: "0" },
          ].map((item) => (
            <div key={item.label}>
              <div className="font-bold text-lg">{item.val}</div>
              <div className="text-[10px] text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: UserCheck, label: "My Bid" },
            { icon: FileSearch, label: "Details" },
            { icon: Download, label: "Deposit" },
            { icon: Upload, label: "Withdraw" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <item.icon size={24} className="text-cyan-500" />
              <span className="text-[9px] text-center text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Common Functions Card */}
      <div className="card p-4">
        <div className="font-semibold mb-3">Common Functions</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: BookOpen, label: "Tutorials" },
            { icon: Settings, label: "Settings" },
            { icon: Coins, label: "Mint" },
            { icon: Star, label: "Collection" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <item.icon size={24} className="text-cyan-500" />
              <span className="text-[9px] text-center text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-20 right-4 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
        <HelpCircle size={24} className="text-white" />
        <span className="absolute -bottom-5 text-xs">Help</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {activeTab === "home" && renderHome()}
      {activeTab !== "home" && (
        <div className="p-6">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
          <p className="mt-2 text-gray-600">Content baad me fill karenge.</p>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav fixed bottom-0 left-0 right-0 flex justify-around py-3">
        {bottomMenu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-4 ${
                activeTab === item.id ? "text-cyan-500" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
