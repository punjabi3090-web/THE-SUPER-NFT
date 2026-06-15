import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-nowpayments-sig",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("x-nowpayments-sig") ?? "";

    /* ── Verify HMAC signature ── */
    const secret = Deno.env.get("NOWPAYMENTS_IPN_SECRET") ?? "";
    if (!secret) {
      console.error("NOWPAYMENTS_IPN_SECRET not set");
      return new Response("Server config error", { status: 500 });
    }

    /* NowPayments signs the sorted JSON keys */
    const payload = JSON.parse(body);
    const sorted = JSON.stringify(
      Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)))
    );
    const expected = hmac("sha512", secret, sorted, "utf8", "hex");

    if (expected !== sig) {
      console.error("Invalid IPN signature");
      return new Response("Invalid signature", { status: 403 });
    }

    /* ── Only process finished payments ── */
    const {
      payment_status,
      order_id,       // we store user_id here when creating payment
      pay_amount,
      actually_paid,
      payment_id,
      pay_currency,
      pay_address,
    } = payload as Record<string, string | number>;

    if (payment_status !== "finished" && payment_status !== "confirmed") {
      return new Response("Ignored — not finished", { status: 200 });
    }

    const amount = Number(actually_paid ?? pay_amount ?? 0);
    if (amount <= 0) {
      return new Response("Amount zero — skipped", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userId = String(order_id);

    /* ── Upsert deposit record ── */
    const { error: depErr } = await supabase
      .from("deposits")
      .upsert(
        {
          user_id: userId,
          amount,
          status: "approved",
          payment_id: String(payment_id),
          currency: String(pay_currency),
          pay_address: String(pay_address),
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );

    if (depErr) {
      console.error("deposit upsert error:", depErr.message);
      return new Response("DB error", { status: 500 });
    }

    /* ── Credit user balance ── */
    const { error: balErr } = await supabase.rpc("increment_balance", {
      uid: userId,
      inc: amount,
    });

    if (balErr) {
      console.error("balance update error:", balErr.message);
    }

    /* ── Update total_deposited on profile ── */
    await supabase.rpc("increment_total_deposit", {
      uid: userId,
      inc: amount,
    });

    console.log(`Payment ${payment_id} processed: +$${amount} for user ${userId}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
