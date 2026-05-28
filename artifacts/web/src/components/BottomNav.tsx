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
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-16">
        {navs.map(n => {
          const Icon = n.icon;
          const active = location === n.path || (location === '/' && n.path === '/');
          return (
            <button
              key={n.path}
              onClick={() => setLocation(n.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-emerald-500' : 'text-gray-400'}
              />
              <span className={`text-[11px] font-medium ${active ? 'text-emerald-500' : 'text-gray-400'}`}>
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
