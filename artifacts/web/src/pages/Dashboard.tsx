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

  return (
    <div className="min-h-screen pb-20" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #d1fae5 100%)'}}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h1>
          <button onClick={() => setLocation("/login")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-700">Welcome! {activeTab} section content yahan aayega.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center py-3">
          {bottomMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  activeTab === item.id ? "text-green-600" : "text-slate-500"
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
