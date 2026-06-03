import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase     = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    const { data: activeNfts, error: fetchErr } = await supabase
      .from("user_nfts")
      .select(`
        id, user_id, nft_package_id, purchase_price, end_date, status,
        nft_packages ( name, daily_profit_percent )
      `)
      .eq("status", "active")
      .gt("end_date", now);

    if (fetchErr) {
      console.error("Fetch error:", fetchErr.message);
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!activeNfts || activeNfts.length === 0) {
      console.log("No active NFTs to process");
      return new Response(JSON.stringify({ success: true, processed: 0, total_paid: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed  = 0;
    let total_paid = 0;
    const errors: string[] = [];

    for (const nft of activeNfts) {
      try {
        const pkg = (nft as any).nft_packages;
        if (!pkg) {
          console.warn(`NFT ${nft.id}: no package data, skipping`);
          continue;
        }

        const daily_profit = (nft.purchase_price * pkg.daily_profit_percent) / 100;

        const [{ error: rpcErr }, { error: txErr }] = await Promise.all([
          supabase.rpc("increment_balance", { uid: nft.user_id, inc: daily_profit }),
          supabase.from("transactions").insert({
            user_id:     nft.user_id,
            type:        "nft_profit",
            amount:      daily_profit,
            description: `Daily profit from ${pkg.name}`,
            created_at:  now,
          }),
        ]);

        if (rpcErr) throw new Error(`increment_balance: ${rpcErr.message}`);
        if (txErr)  console.warn(`Transaction insert for NFT ${nft.id}: ${txErr.message}`);

        const endDate = new Date(nft.end_date);
        const today   = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (endDate <= today) {
          const { error: completeErr } = await supabase
            .from("user_nfts")
            .update({ status: "completed" })
            .eq("id", nft.id);
          if (completeErr) console.warn(`Mark completed ${nft.id}: ${completeErr.message}`);
          else console.log(`NFT ${nft.id} marked completed`);
        }

        processed++;
        total_paid += daily_profit;
        console.log(`NFT ${nft.id} (${pkg.name}): +$${daily_profit.toFixed(4)} → user ${nft.user_id}`);
      } catch (err: any) {
        const msg = `NFT ${nft.id}: ${err?.message ?? err}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    const result = {
      success:    true,
      processed,
      total_paid: parseFloat(total_paid.toFixed(4)),
      skipped:    (activeNfts.length) - processed,
      errors:     errors.length > 0 ? errors : undefined,
      timestamp:  now,
    };
    console.log("Done:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error:", err?.message ?? err);
    return new Response(JSON.stringify({ success: false, error: err?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
