import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Megaphone, X } from "lucide-react";

type Ann = { id: string; message: string };

export default function AnnouncementBanner() {
  const [ann,       setAnn]       = useState<Ann | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, message")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setAnn(data as Ann);
    })();
  }, []);

  if (!ann || dismissed) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-3 border"
      style={{ background: "#FEFCE8", borderColor: "#FDE047" }}>
      <Megaphone size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#854D0E" }} />
      <p className="text-xs leading-relaxed flex-1" style={{ color: "#713F12" }}>
        {ann.message}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-0.5 rounded hover:opacity-60 transition-opacity"
        style={{ color: "#854D0E" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
