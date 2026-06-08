import { Router, type IRouter, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const router: IRouter = Router();

async function getAuthUser(req: Request) {
  const token = ((req.headers["authorization"] as string) ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
  const serviceKey  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!supabaseUrl || !serviceKey) return null;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return { user, admin };
}

// GET /api/2fa/generate  —  generate secret + QR (does NOT save yet)
router.get("/2fa/generate", async (req: Request, res: Response) => {
  const ctx = await getAuthUser(req);
  if (!ctx) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: profile } = await ctx.admin
    .from("profiles").select("totp_enabled").eq("user_id", ctx.user.id).single();

  if (profile?.totp_enabled) {
    res.status(400).json({ error: "2FA already enabled" }); return;
  }

  const secret       = generateSecret();
  const email        = ctx.user.email ?? "user";
  const otpUri       = generateURI({ issuer: "THE SUPER NFT", label: email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpUri);

  res.json({ secret, qrCodeDataUrl });
});

// POST /api/2fa/verify  —  verify the first code and save secret to profiles
router.post("/2fa/verify", async (req: Request, res: Response) => {
  const ctx = await getAuthUser(req);
  if (!ctx) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { secret, token } = req.body as { secret?: string; token?: string };
  if (!secret || !token) {
    res.status(400).json({ error: "secret and token are required" }); return;
  }

  const result = await verify({ secret, token });
  if (!result.valid) {
    res.status(400).json({ error: "Invalid code — check your authenticator app" }); return;
  }

  const { error } = await ctx.admin
    .from("profiles")
    .update({ totp_secret: secret, totp_enabled: true })
    .eq("user_id", ctx.user.id);

  if (error) { res.status(500).json({ error: "Failed to save 2FA settings" }); return; }

  res.json({ ok: true });
});

// POST /api/2fa/validate  —  validate a code during withdrawal (secret stays server-side)
router.post("/2fa/validate", async (req: Request, res: Response) => {
  const ctx = await getAuthUser(req);
  if (!ctx) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: "token is required" }); return; }

  const { data: profile } = await ctx.admin
    .from("profiles").select("totp_secret, totp_enabled").eq("user_id", ctx.user.id).single();

  if (!profile?.totp_enabled || !profile.totp_secret) {
    res.status(400).json({ error: "2FA not enabled" }); return;
  }

  const result = await verify({ secret: profile.totp_secret as string, token });
  res.json({ valid: result.valid });
});

export default router;
