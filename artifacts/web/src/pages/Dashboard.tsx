import { useState } from "react";
import { Home, Shield, TrendingUp, Wallet, User, Menu, X } from "lucide-react";

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
      case "home":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Home</h1>
            <p className="mt-2 text-gray-600">Welcome! Yahan Home ka content aayega.</p>
          </div>
        );
      case "reserve":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Reserve</h1>
            <p className="mt-2 text-gray-600">Reserve section. Baad me fill karenge.</p>
          </div>
        );
      case "stake":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Stake</h1>
            <p className="mt-2 text-gray-600">Stake section. Content baad me.</p>
          </div>
        );
      case "asset":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Asset</h1>
            <p className="mt-2 text-gray-600">Assets yahan dikhenge.</p>
          </div>
        );
      case "profile":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="mt-2 text-gray-600">Profile settings yahan aayengi.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-colors ${
                  activeTab === item.id ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : "text-gray-700"
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-0">
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
