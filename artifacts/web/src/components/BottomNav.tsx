import { useLocation } from "wouter";
import { Home, Coins, Clock, Wallet, User } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const navs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Coins, label: "Stake", path: "/stake" },
    { icon: Clock, label: "Reserve", path: "/reserve" },
    { icon: Wallet, label: "Assets", path: "/assets" },
    { icon: User, label: "My", path: "/my" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="flex justify-around items-center px-4 py-2">
        {navs.map(n => {
          const Icon = n.icon;
          const active = location === n.path || (location === '/' && n.path === '/');
          return (
            <button
              key={n.path}
              onClick={() => setLocation(n.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? 'text-emerald-500' : 'text-gray-400'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
