import { useState } from "react";
import { Home, TrendingUp, Wallet, User } from "lucide-react";
import HomeTab  from "../pages/tabs/Home";
import EarnTab  from "../pages/tabs/Earn";
import AssetTab from "../pages/tabs/Asset";
import ProfileTab from "../pages/tabs/Profile";

type Tab = "home" | "earn" | "asset" | "profile";

const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "home",    label: "Home",    Icon: Home },
  { id: "earn",    label: "Earn",    Icon: TrendingUp },
  { id: "asset",   label: "Asset",   Icon: Wallet },
  { id: "profile", label: "Profile", Icon: User },
];

export default function MainLayout() {
  const [active, setActive] = useState<Tab>("home");

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* ── Page Content ── */}
      <div className="flex-1 overflow-y-auto pb-20">
        {active === "home"    && <HomeTab />}
        {active === "earn"    && <EarnTab />}
        {active === "asset"   && <AssetTab />}
        {active === "profile" && <ProfileTab />}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/60">
        <div className="max-w-md mx-auto flex">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-purple-400" : ""}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-purple-400 rounded-full" style={{ marginTop: 2 }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
