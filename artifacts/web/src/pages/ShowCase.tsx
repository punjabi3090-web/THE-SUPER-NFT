import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import showcaseImg from "@assets/IMG-20260606-WA0110_1780825769189.jpg";

type Profile = { name: string | null; email: string | null; referral_code: string | null; phone: string | null };

export default function ShowCase() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, referral_code, phone")
        .eq("user_id", user.id)
        .single();
      if (error) console.error("Profile fetch error:", error.message);
      setProfile(data ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg,#000 0%,#0a0a1a 50%,#000 100%)" }}
    >
      {/* Profile strip */}
      {!loading && (
        <div className="w-full max-w-[480px] px-4 mb-2">
          <div
            className="rounded-xl px-4 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                {profile?.name || "Welcome!"}
              </p>
              <p className="text-white/50 text-[10px]">{profile?.email || ""}</p>
            </div>
            {profile?.referral_code && (
              <div className="text-right">
                <p className="text-[10px] text-white/40">Referral Code</p>
                <p className="text-white font-bold text-sm tracking-widest">{profile.referral_code}</p>
              </div>
            )}
            {!profile?.referral_code && !loading && (
              <div className="text-right">
                <p className="text-[10px] text-white/40">Phone</p>
                <p className="text-white/70 text-xs">{profile?.phone || "—"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <img
        src={showcaseImg}
        alt="THE SUPER NFT"
        style={{
          width: "100%",
          maxWidth: 480,
          height: "calc(100vh - 140px)",
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
