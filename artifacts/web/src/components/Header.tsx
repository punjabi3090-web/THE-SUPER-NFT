import { Bell, Menu } from "lucide-react";

export default function Header() {
  return (
    <div className="bg-white px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">SN</div>
        <span className="font-bold text-lg text-slate-800">THE SUPER NFT</span>
      </div>
      <div className="flex gap-4 items-center text-slate-600">
        <button onClick={() => console.log('bell clicked')}><Bell size={20} /></button>
        <button onClick={() => console.log('airdrop clicked')} className="text-blue-500 text-sm font-medium">Airdrop</button>
        <button onClick={() => console.log('menu clicked')}><Menu size={20} /></button>
      </div>
    </div>
  );
}
