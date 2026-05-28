import { useLocation } from "wouter";
import { Home, Store, Image, Users, User } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const navs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Store, label: "Market", path: "/market" },
    { icon: Image, label: "NFT", path: "/nft" },
    { icon: Users, label: "Team", path: "/team" },
    { icon: User, label: "Mine", path: "/mine" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 shadow-lg" style={{maxWidth: '448px', margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%'}}>
      {navs.map(n => {
        const active = location === n.path;
        const Icon = n.icon;
        return (
          <button
            key={n.path}
            onClick={() => setLocation(n.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? 'text-emerald-500' : 'text-gray-400'}`}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}
