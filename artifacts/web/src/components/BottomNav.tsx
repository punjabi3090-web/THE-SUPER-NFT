import { useLocation } from "wouter";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const navs = [
    { label: "Stake", path: "/stake" },
    { label: "Earn", path: "/earn" },
    { label: "Reserve", path: "/reserve" },
    { label: "Assets", path: "/assets" },
    { label: "My", path: "/my" },
  ];
  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 z-50" style={{maxWidth: '448px', margin: '0 auto', left: '50%', transform: 'translateX(-50%)'}}>
      <div className="bg-white rounded-full shadow-lg flex justify-around py-3">
        {navs.map(n => (
          <button
            key={n.path}
            onClick={() => setLocation(n.path)}
            className={`text-sm px-2 ${location === n.path ? 'text-black font-semibold' : 'text-gray-400'}`}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
