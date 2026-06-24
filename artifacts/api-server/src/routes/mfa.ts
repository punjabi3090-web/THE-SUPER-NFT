import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function makeUserClient(req: Request) {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const key  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  const tok  = (req.headers.authorization ?? "").replace("Bearer ", "");
  return createClient(url, key, {
    auth:   { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${tok}` } },
  });
}

// POST /api/mfa/enroll
router.post("/enroll", async (req: Request, res: Response): Promise<void> => {
  const client = makeUserClient(req);
  const { data, error } = await client.auth.mfa.enroll({ factorType: "totp" });
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
});

// POST /api/mfa/challenge
router.post("/challenge", async (req: Request, res: Response): Promise<void> => {
  const { factorId } = req.body as { factorId?: string };
  if (!factorId) { res.status(400).json({ error: "factorId required" }); return; }
  const client = makeUserClient(req);
  const { data, error } = await client.auth.mfa.challenge({ factorId });
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ ok: true, challengeId: data.id });
});

// POST /api/mfa/verify
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  const { factorId, challengeId, code } = req.body as {
    factorId?: string; challengeId?: string; code?: string;
  };
  if (!factorId || !challengeId || !code) {
    res.status(400).json({ error: "factorId, challengeId, code required" }); return;
  }
  const client = makeUserClient(req);
  const { error } = await client.auth.mfa.verify({ factorId, challengeId, code });
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// POST /api/mfa/unenroll
router.post("/unenroll", async (req: Request, res: Response): Promise<void> => {
  const { factorId } = req.body as { factorId?: string };
  if (!factorId) { res.status(400).json({ error: "factorId required" }); return; }
  const client = makeUserClient(req);
  const { error } = await client.auth.mfa.unenroll({ factorId });
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;
