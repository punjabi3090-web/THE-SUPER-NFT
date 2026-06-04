import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { Sparkles, RefreshCw } from "lucide-react";

type Props = {
  onClaimed?: () => void;
};

export default function ClaimProfitButton({ onClaimed }: Props) {
  const [loading, setLoading]   = useState(false);
  const [claimed, setClaimed]   = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    const toastId = toast.loading("Claiming your profit...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("claim-profit", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const amount: number = typeof data === "number" ? data : (data?.amount ?? data?.claimed ?? 0);

      toast.success(
        amount > 0 ? `Claimed $${Number(amount).toFixed(2)} ✓` : "Nothing to claim right now",
        { id: toastId, duration: 4000 }
      );

      if (amount > 0) {
        setClaimed(true);
        onClaimed?.();
      } else {
        toast.dismiss(toastId);
        toast("No pending profit to claim.", { icon: "ℹ️" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Claim failed", { id: toastId });
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleClaim}
      disabled={loading || claimed}
      className={`
        w-full flex items-center justify-center gap-2.5 font-bold text-sm rounded-2xl py-4 transition-colors
        ${claimed
          ? "bg-emerald-800 text-emerald-300 cursor-not-allowed"
          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95"}
        disabled:opacity-60
      `}
    >
      {loading
        ? <><RefreshCw size={16} className="animate-spin" /> Claiming...</>
        : claimed
        ? <>✓ Profit Claimed</>
        : <><Sparkles size={16} /> Claim Profit</>
      }
    </button>
  );
}
