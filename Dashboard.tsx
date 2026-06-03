import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Bookmark, Coins, Wallet, User } from "lucide-react";
import { supabase } from './lib/supabase';



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [, setLocation] = useLocation();

  // NAYA CODE - USER + PROFILE KE LIYE
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      // 1. Supabase session check
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError ||!user) {
        setLocation("/login");
        return;
      }

      setUser(user);
      console.log('Auth User:', user);

      // 2. Profile table se data lao
      const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', user.id)
       .single();

      console.log('Profile Data:', data);
      console.log('Profile Error:', error);
      setProfile(data);
      setLoading(false);
    };

    loadUserData();
  }, [setLocation]);

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "reserve", icon: Bookmark, label: "Reserve" },
    { id: "stake", icon: Coins, label: "Stake" },
    { id: "asset", icon: Wallet, label: "Asset" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const copyReferral = () => {
    if (profile?.referral_link) {
      navigator.clipboard.writeText(profile.referral_link);
      alert('Referral link copied!');
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Content Area */}
      <div className="p-4">
        {activeTab === "home" && <div>Home Content Yahan</div>}
        {activeTab === "reserve" && <div>Reserve Content Yahan</div>}
        {activeTab === "stake" && <div>Stake Content Yahan</div>}
        {activeTab === "asset" && <div>Asset Content Yahan</div>}

        {/* PROFILE TAB - YAHAN ASLI DATA DIKHEGA */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Full Name</p>
              <p className="font-semibold">{profile?.username || '---'}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-semibold">{user?.email || '---'}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">User ID</p>
              <p className="text-xs break-all">{user?.id || '---'}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">My Referral Code</p>
              <div className="flex justify-between items-center">
                <p className="font-semibold">{profile?.referral_code || '---'}</p>
                <button onClick={copyReferral} className="bg-purple-600 px-3 py-1 rounded text-sm">
                  Copy Link
                </button>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="font-semibold">${profile?.balance || '0.00'}</p>
            </div>
          </div>
        )}
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
                className={`flex flex-col items-center gap-1 ${isActive? "text-purple-500" : "text-gray-400"}`}
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

