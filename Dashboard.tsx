import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Bookmark, Coins, Wallet, User } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setLocation("/login");
  }, []);

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "reserve", icon: Bookmark, label: "Reserve" },
    { id: "stake", icon: Coins, label: "Stake" },
    { id: "asset", icon: Wallet, label: "Asset" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Content Area */}
      <div className="p-4">
        {activeTab === "home" && <div>Home Content Yahan</div>}
        {activeTab === "reserve" && <div>Reserve Content Yahan</div>}
        {activeTab === "stake" && <div>Stake Content Yahan</div>}
        {activeTab === "asset" && <div>Asset Content Yahan</div>}
        {activeTab === "profile" && <div>Profile Content Yahan</div>}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 ${
                  isActive? "text-purple-500" : "text-gray-400"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}