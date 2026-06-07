import { useNavigate } from "react-router-dom";
import showcaseImg from "@assets/IMG-20260606-WA0110_1780825769189.jpg";

export default function ShowCase() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg,#000 0%,#0a0a1a 50%,#000 100%)" }}
    >
      <img
        src={showcaseImg}
        alt="THE SUPER NFT"
        style={{
          width: "100%",
          maxWidth: 480,
          height: "calc(100vh - 90px)",
          objectFit: "contain",
          display: "block",
        }}
      />

      <button
        onClick={() => navigate("/", { replace: true })}
        className="mt-3 px-10 py-3 rounded-2xl font-bold text-white text-sm tracking-wide transition-all active:scale-95"
        style={{
          background: "linear-gradient(90deg,#DC2626,#1E3A8A)",
          boxShadow: "0 0 24px rgba(220,38,38,0.5)",
          minWidth: 220,
        }}
      >
        Continue to Dashboard →
      </button>
    </div>
  );
}
