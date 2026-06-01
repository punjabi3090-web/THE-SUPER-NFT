import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const NFT_CARDS = [
  {
    img: "/images/nft-card-1.png",
    name: "NFT #1",
    price: "$100",
    edition: "1 of 100",
    rarity: "Legendary",
    rarityColor: "from-yellow-400 to-orange-500",
  },
  {
    img: "/images/nft-card-2.png",
    name: "NFT #2",
    price: "$250",
    edition: "1 of 10,000",
    rarity: "Rare",
    rarityColor: "from-blue-400 to-purple-500",
  },
  {
    img: "/images/nft-card-3.png",
    name: "NFT #3",
    price: "$500",
    edition: "1 of 7,777",
    rarity: "Epic",
    rarityColor: "from-purple-400 to-pink-500",
  },
  {
    img: "/images/nft-card-4.png",
    name: "NFT #4",
    price: "$1000",
    edition: "1 of 5,555",
    rarity: "Ultra Rare",
    rarityColor: "from-cyan-400 to-blue-500",
  },
];

export default function Showcase() {
  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(r => setTimeout(r, 300));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.replace('/login');
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">

      {/* ── Banner ─────────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden" style={{ maxHeight: 500 }}>
        <img
          src="/images/super-poster.png"
          alt="The Super NFT"
          className="w-full object-cover object-top"
          style={{ maxHeight: 500 }}
        />
      </div>

      {/* ── Heading ────────────────────────────────────────────────── */}
      <div className="text-center py-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
          The Super NFTs Collections
        </h1>
        <p className="text-slate-400 text-sm mt-2">Own the Future — Limited Edition Digital Assets</p>
      </div>

      {/* ── Cards Grid ─────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 grid grid-cols-2 gap-4 pb-8">
        {NFT_CARDS.map((card) => (
          <div
            key={card.name}
            className="rounded-2xl overflow-hidden border border-purple-800/40 bg-gradient-to-b from-[#12122a] to-[#0d0d1e] shadow-lg shadow-purple-900/30 flex flex-col"
          >
            {/* Card image */}
            <div className="relative">
              <img
                src={card.img}
                alt={card.name}
                className="w-full object-cover aspect-video"
              />
              {/* Rarity badge */}
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${card.rarityColor} text-white shadow`}>
                {card.rarity}
              </span>
            </div>

            {/* Card info */}
            <div className="p-3 flex flex-col flex-1">
              <p className="font-bold text-white text-sm">{card.name}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{card.edition}</p>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-emerald-400">{card.price}</span>
                <span className="text-slate-400 text-[10px]">USDT</span>
              </div>

              {/* Reserve button */}
              <button
                onClick={() => { window.location.replace('/reserve'); }}
                className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white transition-all shadow shadow-purple-800/40 active:scale-95"
              >
                Reserve Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Enter Dashboard ────────────────────────────────────────── */}
      <div className="text-center px-4 pb-12">
        <button
          onClick={() => { window.location.replace('/dashboard'); }}
          className="px-10 py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
        >
          Enter Dashboard →
        </button>
        <p className="text-slate-600 text-xs mt-3">Tap to continue to your wallet</p>
      </div>

    </div>
  );
}
