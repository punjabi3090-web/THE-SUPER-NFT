import { useState } from "react";
import { Home, Shield, TrendingUp, Wallet, DollarSign, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("home");

  const bottomMenu = [
    { id: "home", label: "Home", icon: Home },
    { id: "reserve", label: "Reserve", icon: Shield },
    { id: "stake", label: "Stake", icon: TrendingUp },
    { id: "asset", label: "Asset", icon: Wallet },
    { id: "profit", label: "Profit", icon: DollarSign },
  ];

  const handleLogout = () => {
    setLocation("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Home</h1>
              <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white">
                <LogOut size={20} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <p className="text-slate-300">Welcome to THE SUPER NFT!</p>
            </div>
          </div>
        );
      case "reserve":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Reserve</h1>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <p className="text-slate-300">Reserve section content.</p>
            </div>
          </div>
        );
      case "stake":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Stake</h1>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <p className="text-slate-300">Staking section content.</p>
            </div>
          </div>
        );
      case "asset":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Asset</h1>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <p className="text-slate-300">Asset section content.</p>
            </div>
          </div>
        );
      case "profit":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Profit</h1>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <p className="text-slate-300">Profit section content.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {renderContent()}

      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
        <div className="flex justify-around items-center py-3">
          {bottomMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  activeTab === item.id ? "text-purple-400" : "text-slate-400"
                }`}
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
