import { useLocation } from "wouter";
import { Home, Clock, TrendingUp, Wallet, User } from "lucide-react";

const NAVS = [
  { icon: Home,       label: "Home",    path: "/" },
  { icon: Clock,      label: "Reserve", path: "/reserve" },
  { icon: TrendingUp, label: "Stake",   path: "/stake" },
  { icon: Wallet,     label: "Asset",   path: "/assets" },
  { icon: User,       label: "My",      path: "/my" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 448,
        background: '#FFFFFF',
        borderTop: '1px solid #F0F0F0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        height: 60,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 16px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAVS.map(n => {
        const Icon = n.icon;
        const active = location === n.path;
        return (
          <button
            key={n.path}
            onClick={() => setLocation(n.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              borderTop: active ? '2px solid #1A1A1A' : '2px solid transparent',
              cursor: 'pointer',
              padding: '8px 0',
              marginTop: active ? -2 : 0,
            }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 2}
              color={active ? '#1A1A1A' : '#999999'}
            />
            <span style={{
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              color: active ? '#1A1A1A' : '#999999',
            }}>
              {n.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
