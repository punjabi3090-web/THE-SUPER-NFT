import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { db, nftNowpaymentsDeposits } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: Router = Router();

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";
const IPN_CALLBACK    = "https://the-super-nft--hamzakhanjam309.replit.app/api/nowpayments/webhook";

function getAdminClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const key  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

type NpPaymentResponse = {
  payment_id:   string;
  pay_address:  string;
  pay_amount:   number;
  pay_currency: string;
};

// ── POST /api/create-payment ────────────────────────────────────────────────
// Body: { amount: number, userId: string, network: 'usdttrc20' | 'usdtbsc' }
// Returns: { address, amount, qr, paymentId }
router.post("/create-payment", async (req: Request, res: Response): Promise<void> => {
  const { amount, userId, network } = req.body as {
    amount?: number; userId?: string; network?: string;
  };

  if (!amount || !userId || !network) {
    res.status(400).json({ error: "amount, userId, and network are required" }); return;
  }
  if (!["usdttrc20", "usdtbsc"].includes(network)) {
    res.status(400).json({ error: "network must be usdttrc20 or usdtbsc" }); return;
  }

  const apiKey = process.env["NOWPAYMENTS_API_KEY"] ?? "";
  if (!apiKey) {
    res.status(500).json({ error: "NowPayments API key not configured" }); return;
  }

  // Use globalThis.fetch so the return type is the Web API Response, not Express Response
  let httpRes: globalThis.Response;
  try {
    httpRes = await globalThis.fetch(`${NOWPAYMENTS_API}/payment`, {
      method:  "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount:        Number(amount),
        price_currency:      "usd",
        pay_currency:        network,
        order_id:            userId,
        ipn_callback_url:    IPN_CALLBACK,
        is_fixed_rate:       false,
        is_fee_paid_by_user: false,
      }),
    });
  } catch (err) {
    req.log.error({ err }, "NowPayments fetch failed");
    res.status(502).json({ error: "Failed to reach NowPayments" }); return;
  }

  if (!httpRes.ok) {
    const body = await httpRes.text();
    req.log.error({ status: httpRes.status, body }, "NowPayments API error");
    res.status(502).json({ error: `NowPayments error: ${body}` }); return;
  }

  const payment = (await httpRes.json()) as NpPaymentResponse;

  // Persist to local DB for webhook lookup
  await db.insert(nftNowpaymentsDeposits).values({
    supabaseUid: userId,
    paymentId:   payment.payment_id,
    payAddress:  payment.pay_address,
    priceAmount: String(amount),
    payCurrency: payment.pay_currency,
    status:      "waiting",
  });

  req.log.info({ userId, paymentId: payment.payment_id, network }, "NowPayments payment created");

  // QR via public service — NowPayments doesn't return one directly
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payment.pay_address)}`;

  res.setHeader("Cache-Control", "no-store");
  res.json({
    address:   payment.pay_address,
    amount:    payment.pay_amount,
    qr,
    paymentId: payment.payment_id,
    currency:  payment.pay_currency,
  });
});

// ── POST /api/nowpayments/webhook ───────────────────────────────────────────
// NowPayments IPN callback — called by NowPayments when payment status changes
router.post("/nowpayments/webhook", async (req: Request, res: Response): Promise<void> => {
  // Verify HMAC if IPN secret is configured
  const ipnSecret = process.env["NOWPAYMENTS_IPN_SECRET"] ?? "";
  if (ipnSecret) {
    const sig     = (req.headers["x-nowpayments-sig"] as string) ?? "";
    const sorted  = Object.keys(req.body as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (req.body as Record<string, unknown>)[k];
        return acc;
      }, {});
    const expected = crypto
      .createHmac("sha512", ipnSecret)
      .update(JSON.stringify(sorted))
      .digest("hex");
    if (sig !== expected) {
      req.log.warn("NowPayments webhook signature mismatch");
      res.status(401).json({ error: "Invalid signature" }); return;
    }
  }

  const {
    payment_id,
    payment_status,
    order_id,       // = supabase user UUID set at creation time
    actually_paid,
    pay_amount,
  } = req.body as {
    payment_id?:     string;
    payment_status?: string;
    order_id?:       string;
    actually_paid?:  number;
    pay_amount?:     number;
  };

  req.log.info({ payment_id, payment_status, order_id }, "NowPayments webhook received");

  if (!payment_id || !payment_status) {
    res.status(400).json({ error: "Missing payment_id or payment_status" }); return;
  }

  // Update local DB status
  await db
    .update(nftNowpaymentsDeposits)
    .set({ status: payment_status, updatedAt: new Date() })
    .where(eq(nftNowpaymentsDeposits.paymentId, payment_id));

  // Credit balance only when payment is fully confirmed
  if (payment_status === "finished") {
    const userId     = order_id;
    const paidAmount = actually_paid ?? pay_amount ?? 0;

    if (!userId || paidAmount <= 0) {
      req.log.error({ userId, paidAmount }, "Webhook finished but missing userId or amount");
      res.sendStatus(200); return;
    }

    const adminClient = getAdminClient();

    const { data: profileData, error: selectErr } = await adminClient
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectErr || !profileData) {
      req.log.error({ selectErr, userId }, "Could not fetch profile for balance update");
      res.sendStatus(200); return;
    }

    const newBalance = Number(profileData.balance ?? 0) + paidAmount;

    const { error: updateErr } = await adminClient
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (updateErr) {
      req.log.error({ updateErr, userId, newBalance }, "Failed to update profile balance");
    } else {
      req.log.info({ userId, paidAmount, newBalance }, "Profile balance updated after NowPayments");
    }
  }

  res.sendStatus(200);
});

// ── GET /api/nowpayments/status/:paymentId ─────────────────────────────────
// Frontend polls this to show live payment status
router.get("/nowpayments/status/:paymentId", async (req: Request, res: Response): Promise<void> => {
  const paymentId = req.params["paymentId"] as string;

  const [row] = await db
    .select({ status: nftNowpaymentsDeposits.status })
    .from(nftNowpaymentsDeposits)
    .where(eq(nftNowpaymentsDeposits.paymentId, paymentId));

  if (!row) { res.status(404).json({ error: "Payment not found" }); return; }

  res.setHeader("Cache-Control", "no-store");
  res.json({ status: row.status });
});

export default router;
