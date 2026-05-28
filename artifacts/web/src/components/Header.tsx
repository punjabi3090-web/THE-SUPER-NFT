import { useState, useRef, useEffect } from "react";
import { Bell, Menu, Globe, Send, Headphones, X } from "lucide-react";
import { useLocation } from "wouter";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const menuItems = [
    {
      icon: Globe,
      label: "Language",
      color: "text-blue-500",
      onClick: () => { console.log('menu: language'); setLocation('/language'); setMenuOpen(false); },
    },
    {
      icon: Send,
      label: "Telegram",
      color: "text-cyan-500",
      onClick: () => { console.log('menu: telegram'); window.open('https://t.me/thesupernft', '_blank'); setMenuOpen(false); },
    },
    {
      icon: Headphones,
      label: "Service",
      color: "text-emerald-500",
      onClick: () => { console.log('menu: service'); setLocation('/service'); setMenuOpen(false); },
    },
  ];

  return (
    <div className="bg-white px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">SN</div>
        <span className="font-bold text-lg text-slate-800">THE SUPER NFT</span>
      </div>

      <div className="flex items-center gap-3 text-slate-600">
        <button onClick={() => console.log('bell clicked')}><Bell size={20} /></button>
        <button
          onClick={() => console.log('airdrop clicked')}
          className="text-blue-500 text-sm font-medium"
        >
          Airdrop
        </button>

        {/* 3-dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`p-1 rounded-lg transition-colors ${menuOpen ? 'bg-slate-100' : ''}`}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-44 z-50">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                  >
                    <Icon size={18} className={item.color} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
