import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import {
  db,
  nftUsers, nftSettings, nftReferrals, nftWithdrawals,
  nftNotifications, nftAdminLogs, nftOrders, nftDeposits,
} from "@workspace/db";

const router: IRouter = Router();

// ── In-memory admin sessions ──────────────────────────────────────────────────
const adminSessions = new Set<string>();
const adminOtpStore = new Map<string, { otp: string; expires: number }>();
const ADMIN_EMAILS_LIST = ["businesstech10002@gmail.com", "thesupernftref88rk56@gmail.com"];

// ── Seed admin credentials on first run ──────────────────────────────────────
export async function seedAdmin() {
  try {
    const [existing] = await db.select({ key: nftSettings.key })
      .from(nftSettings).where(eq(nftSettings.key, "admin_password"));
    if (!existing) {
      const hash = await bcrypt.hash("SuperAdmin@2026", 12);
      await db.insert(nftSettings).values([
        { key: "admin_email", value: "admin@supernft.com" },
        { key: "admin_password", value: hash },
      ]).onConflictDoNothing();
    }
  } catch (e) {
    console.error("Seed admin failed:", e);
  }
}

// ── OTP email helper ──────────────────────────────────────────────────────────
async function sendOtp(to: string, name: string, otp: string, subject: string, desc: string): Promise<void> {
  const emailUser = process.env["EMAIL_USER"];
  const emailPass = process.env["EMAIL_PASS"];
  if (!emailUser || !emailPass) return;
  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: emailUser, pass: emailPass } });
    await transporter.sendMail({
      from: `"THE SUPER NFT" <${emailUser}>`,
      to, subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#f8f9fa;border-radius:12px;padding:32px;text-align:center;"><h2 style="color:#1E3A8A;">THE SUPER NFT</h2><p style="color:#333;margin-bottom:4px;">Hi <strong>${name}</strong>,</p><p style="color:#555;">${desc}</p><div style="background:#1E3A8A;color:white;font-size:38px;font-weight:bold;letter-spacing:14px;padding:20px 32px;border-radius:12px;margin:24px auto;display:inline-block;">${otp}</div><p style="color:#888;font-size:13px;">This code expires in <strong>15 minutes</strong>. Never share it with anyone.</p><hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/><p style="color:#bbb;font-size:11px;">THE SUPER NFT · Community World</p></div>`,
    });
  } catch (_e) { /* silent */ }
}

function genOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function num(v: unknown): number {
  return parseFloat(String(v ?? 0)) || 0;
}

function mapUser(u: typeof nftUsers.$inferSelect) {
  return {
    id: u.id,
    userId: String(u.id),
    email: u.email,
    name: u.name,
    username: u.username ?? "",
    phone: u.phone ?? "",
    country: u.country ?? "",
    myReferralCode: u.myReferralCode,
    referralCode: u.myReferralCode,
    joinedWithCode: u.joinedWithCode ?? null,
    referredBy: u.joinedWithCode ?? null,
    coins: u.coins,
    walletBalance: num(u.walletBalance),
    nftAccountBalance: num(u.nftAccountBalance),
    totalDeposit: num(u.totalDeposit),
    totalWithdraw: num(u.totalWithdraw),
    reserveIncome: num(u.reserveIncome),
    teamIncome: num(u.teamIncome),
    activityIncome: num(u.activityIncome),
    level: u.level,
    isAdmin: u.isAdmin,
    isBlocked: u.isBlocked,
    googleAuthBound: u.googleAuthBound,
    googleAuthSecret: null as null,
    withdrawalAddress: u.withdrawalAddress ?? null,
    bep20Address: u.bep20Address ?? null,
    trc20Address: u.trc20Address ?? null,
    addressBindDate: u.addressBindDate?.toISOString() ?? null,
    registeredAt: u.registeredAt.toISOString(),
    joinDate: u.registeredAt.toISOString(),
    lastLogin: u.lastLogin.toISOString(),
    myActivityHistory: [] as unknown[],
  };
}

function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!token || !adminSessions.has(token)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}

async function logAdmin(action: string, target: string, amount = 0, details = "") {
  try {
    await db.insert(nftAdminLogs).values({
      admin: "admin@supernft.com", action, target,
      amount: String(amount), details,
    });
  } catch { /* non-critical */ }
}

// ── Generate unique referral code ─────────────────────────────────────────────
async function genReferralCode(name: string): Promise<string> {
  const base = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(4, "X");
  for (let i = 0; i < 20; i++) {
    const code = base + Math.floor(1000 + Math.random() * 9000);
    const [exists] = await db.select({ id: nftUsers.id }).from(nftUsers)
      .where(eq(nftUsers.myReferralCode, code));
    if (!exists) return code;
  }
  return "REF" + Date.now().toString(36).toUpperCase();
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════════════════════

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, country, referralCode } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }

  const normalEmail = email.toLowerCase().trim();

  let joinedWithCode: string | null = null;
  const refParam = referralCode?.trim();
  if (refParam) {
    if (/^\d+$/.test(refParam)) {
      const [byId] = await db.select({ myReferralCode: nftUsers.myReferralCode })
        .from(nftUsers).where(eq(nftUsers.id, parseInt(refParam)));
      if (byId) {
        joinedWithCode = byId.myReferralCode;
      } else {
        const allPhones = await db.select({ myReferralCode: nftUsers.myReferralCode, phone: nftUsers.phone }).from(nftUsers);
        const byPhone = allPhones.find(u => {
          const digits = (u.phone || '').replace(/\D/g, '');
          return digits.length >= 6 && digits.slice(-6).padStart(6, '0') === refParam.padStart(6, '0');
        });
        if (byPhone) joinedWithCode = byPhone.myReferralCode;
      }
    } else {
      joinedWithCode = refParam;
    }
  }

  const [existing] = await db.select({ id: nftUsers.id, isVerified: nftUsers.isVerified })
    .from(nftUsers).where(eq(nftUsers.email, normalEmail));

  if (existing) {
    if (existing.isVerified) {
      res.status(409).json({ error: "Email already registered. Please login." }); return;
    }
    const otp = genOtp();
    await db.update(nftUsers)
      .set({ otpCode: otp, otpExpiry: new Date(Date.now() + 15 * 60 * 1000) })
      .where(eq(nftUsers.id, existing.id));
    sendOtp(normalEmail, name, otp, "Verify Your Email - THE SUPER NFT", "Your email verification code is:").catch(() => {});
    res.json({ needsOtp: true }); return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const myReferralCode = await genReferralCode(name);
  const otp = genOtp();

  const [user] = await db.insert(nftUsers).values({
    email: normalEmail,
    passwordHash,
    name,
    username: normalEmail.split("@")[0],
    phone: phone ?? null,
    country: country ?? null,
    myReferralCode,
    joinedWithCode,
    otpCode: otp,
    otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
    isVerified: false,
  }).returning();

  sendOtp(normalEmail, name, otp, "Verify Your Email - THE SUPER NFT", "Your email verification code is:").catch(() => {});
  req.log.info({ userId: user.id, email: normalEmail }, "NFT user registered");
  res.json({ needsOtp: true });
});

router.post("/auth/verify-signup-otp", async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  if (!email?.trim() || !otp?.trim()) {
    res.status(400).json({ error: "Email and OTP required" }); return;
  }
  const [user] = await db.select().from(nftUsers)
    .where(eq(nftUsers.email, email.toLowerCase().trim()));
  if (!user) { res.status(400).json({ error: "Account not found" }); return; }
  if (user.isVerified) { res.json({ ok: true }); return; }
  if (!user.otpCode || !user.otpExpiry) {
    res.status(400).json({ error: "No OTP found. Please register again." }); return;
  }
  if (user.otpExpiry < new Date()) {
    res.status(400).json({ error: "OTP expired. Please register again." }); return;
  }
  if (user.otpCode !== otp.trim()) {
    res.status(400).json({ error: "Incorrect OTP. Try again." }); return;
  }
  await db.update(nftUsers)
    .set({ isVerified: true, otpCode: null, otpExpiry: null })
    .where(eq(nftUsers.id, user.id));
  if (user.joinedWithCode) {
    await db.insert(nftReferrals).values({
      referrerCode: user.joinedWithCode,
      newUserEmail: user.email,
      newUserId: user.id,
    }).onConflictDoNothing();
  }
  res.json({ ok: true });
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" }); return;
  }
  const [user] = await db.select().from(nftUsers)
    .where(eq(nftUsers.email, email.toLowerCase()));
  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }
  if (user.isBlocked) { res.status(403).json({ error: "Account blocked. Contact support." }); return; }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }
  if (!user.isVerified) {
    res.status(403).json({ error: "Please verify your email first. Check your inbox for the OTP code." }); return;
  }
  await db.update(nftUsers).set({ lastLogin: new Date() }).where(eq(nftUsers.id, user.id));
  res.json({ user: mapUser({ ...user, lastLogin: new Date() }) });
});

router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email?.trim()) { res.status(400).json({ error: "Email required" }); return; }
  const [user] = await db.select({ id: nftUsers.id, email: nftUsers.email, name: nftUsers.name })
    .from(nftUsers).where(eq(nftUsers.email, email.toLowerCase().trim()));
  if (!user) { res.json({ ok: true }); return; }
  const otp = genOtp();
  await db.update(nftUsers)
    .set({ resetToken: otp, resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) })
    .where(eq(nftUsers.id, user.id));
  sendOtp(user.email, user.name, otp, "Password Reset OTP - THE SUPER NFT", "Your password reset code is:").catch(() => {});
  res.json({ ok: true });
});

router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { email, otp, password } = req.body;
  if (!email?.trim() || !otp?.trim() || !password) {
    res.status(400).json({ error: "Email, OTP and new password required" }); return;
  }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }
  const [user] = await db.select({
    id: nftUsers.id, resetToken: nftUsers.resetToken, resetTokenExpiry: nftUsers.resetTokenExpiry,
  }).from(nftUsers).where(eq(nftUsers.email, email.toLowerCase().trim()));
  if (!user || !user.resetToken) { res.status(400).json({ error: "Invalid OTP or email" }); return; }
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "OTP expired. Please request a new one." }); return;
  }
  if (user.resetToken !== otp.trim()) { res.status(400).json({ error: "Incorrect OTP. Try again." }); return; }
  const hash = await bcrypt.hash(password, 10);
  await db.update(nftUsers)
    .set({ passwordHash: hash, resetToken: null, resetTokenExpiry: null })
    .where(eq(nftUsers.id, user.id));
  res.json({ ok: true });
});

// POST /api/nft/auth/create-profile ──────────────────────────────────────────
// Called right after supabase.auth.signUp() on the frontend.
// Uses the SERVICE ROLE KEY server-side → bypasses ALL RLS policies.
// Body: { accessToken, userId, email, name, phone, referralCode }
router.post("/auth/create-profile", async (req: Request, res: Response): Promise<void> => {
  const { accessToken, userId, email, name, phone, referralCode } = req.body as {
    accessToken?: string; userId?: string; email?: string;
    name?: string; phone?: string; referralCode?: string;
  };

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" }); return;
  }

  const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const serviceKey  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Supabase service credentials not configured" }); return;
  }

  // Verify the access token matches the claimed userId (security check)
  if (accessToken) {
    try {
      const verifyClient = createClient(supabaseUrl, serviceKey);
      const { data: { user }, error: verifyErr } = await verifyClient.auth.getUser(accessToken);
      if (verifyErr || !user || user.id !== userId) {
        res.status(401).json({ error: "Invalid access token" }); return;
      }
    } catch {
      res.status(401).json({ error: "Token verification failed" }); return;
    }
  }

  // Service-role client — bypasses RLS entirely
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const newRefCode = "FAIS" + Math.floor(1000 + Math.random() * 9000);

  const { error: profileError } = await adminClient.from("profiles").upsert({
    user_id:          userId,
    email:            email.trim().toLowerCase(),
    name:             (name ?? "").trim(),
    phone:            (phone ?? "").trim(),
    referral_code:    newRefCode,
    referred_by_code: referralCode?.trim().toUpperCase() || null,
  }, { onConflict: "user_id" });

  if (profileError) {
    req.log.error({ profileError, userId }, "create-profile failed");
    res.status(400).json({ error: profileError.message }); return;
  }

  req.log.info({ userId, email, referralCode }, "Supabase profile created via service role");
  res.json({ ok: true, referral_code: newRefCode });
});

// GET /api/nft/auth/team ──────────────────────────────────────────────────
// Returns the logged-in user's team count + member list from Supabase profiles.
// Uses SERVICE ROLE KEY — bypasses ALL RLS policies (SELECT included).
// Auth: Authorization: Bearer {supabase_access_token}
router.get("/auth/team", async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization ?? "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!accessToken) {
    res.status(401).json({ error: "Missing access token" }); return;
  }

  const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const serviceKey  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Supabase service credentials not configured" }); return;
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify token — get the real user id
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(accessToken);
  if (authErr || !user) {
    res.status(401).json({ error: "Invalid access token" }); return;
  }

  // Get this user's own profile to find their referral_code
  const { data: myProfile } = await adminClient
    .from("profiles")
    .select("referral_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myProfile?.referral_code) {
    res.setHeader("Cache-Control", "no-store");
    res.json({ count: 0, members: [], referral_code: null }); return;
  }

  const myRefCode = myProfile.referral_code as string;

  // Count + list — both bypass RLS via service role
  const [countResult, membersResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by_code", myRefCode),
    adminClient
      .from("profiles")
      .select("user_id, name")
      .eq("referred_by_code", myRefCode)
      .order("created_at", { ascending: false }),
  ]);

  req.log.info({ userId: user.id, myRefCode, count: countResult.count }, "team data fetched");

  res.setHeader("Cache-Control", "no-store");
  res.json({
    count:         countResult.count ?? 0,
    members:       membersResult.data ?? [],
    referral_code: myRefCode,
  });
});

// POST /api/nft/auth/supabase-sync ─────────────────────────────────────────
// Called by the React app after every Supabase SIGNED_IN event.
// Finds or creates the nftUsers row for this Supabase user and returns the
// numeric DB id + full mapped user object so the frontend can use all
// existing Express routes (which expect a numeric userId).
router.post("/auth/supabase-sync", async (req: Request, res: Response): Promise<void> => {
  const { email, name, phone, referralCode } = req.body as {
    email?: string; name?: string; phone?: string; referralCode?: string;
  };
  if (!email?.trim()) { res.status(400).json({ error: "Email required" }); return; }

  const normalEmail = email.toLowerCase().trim();

  // Return existing user immediately (happy path)
  const [existing] = await db.select().from(nftUsers).where(eq(nftUsers.email, normalEmail));
  if (existing) {
    await db.update(nftUsers).set({ lastLogin: new Date() }).where(eq(nftUsers.id, existing.id));
    res.json({ numericId: existing.id, user: mapUser({ ...existing, lastLogin: new Date() }) });
    return;
  }

  // Resolve referral code: numeric UID → referral code, or direct alphanumeric code
  let joinedWithCode: string | null = null;
  const refParam = referralCode?.trim();
  if (refParam) {
    if (/^\d+$/.test(refParam)) {
      const [byId] = await db.select({ myReferralCode: nftUsers.myReferralCode })
        .from(nftUsers).where(eq(nftUsers.id, parseInt(refParam)));
      if (byId) {
        joinedWithCode = byId.myReferralCode;
      } else {
        const allPhones = await db.select({ myReferralCode: nftUsers.myReferralCode, phone: nftUsers.phone }).from(nftUsers);
        const byPhone = allPhones.find(u => {
          const digits = (u.phone ?? "").replace(/\D/g, "");
          return digits.length >= 6 && digits.slice(-6).padStart(6, "0") === refParam.padStart(6, "0");
        });
        if (byPhone) joinedWithCode = byPhone.myReferralCode;
      }
    } else {
      joinedWithCode = refParam;
    }
  }

  const displayName = name?.trim() || normalEmail.split("@")[0];
  const myReferralCode = await genReferralCode(displayName);

  const [newUser] = await db.insert(nftUsers).values({
    email: normalEmail,
    passwordHash: "$supabase_managed$",
    name: displayName,
    username: normalEmail.split("@")[0],
    phone: phone?.trim() || null,
    myReferralCode,
    joinedWithCode,
    isVerified: true,
    lastLogin: new Date(),
  }).returning();

  if (joinedWithCode) {
    await db.insert(nftReferrals).values({
      referrerCode: joinedWithCode,
      newUserEmail: normalEmail,
      newUserId: newUser.id,
    }).onConflictDoNothing();
  }

  req.log.info({ userId: newUser.id, email: normalEmail }, "NFT user created via Supabase sync");
  res.json({ numericId: newUser.id, user: mapUser(newUser) });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ══════════════════════════════════════════════════════════════════════════════

const ADMIN_EMAILS = [
  "businesstech10002@gmail.com",
  "thesupernftref88rk56@gmail.com",
];

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const inputEmail = email?.toLowerCase()?.trim() ?? "";
  if (!ADMIN_EMAILS.includes(inputEmail)) {
    res.status(401).json({ error: "Invalid admin credentials" }); return;
  }
  const [passSetting] = await db.select().from(nftSettings)
    .where(eq(nftSettings.key, "admin_password"));
  if (!passSetting) { res.status(500).json({ error: "Admin not configured" }); return; }
  const valid = await bcrypt.compare(password, passSetting.value);
  if (!valid) { res.status(401).json({ error: "Invalid admin credentials" }); return; }
  const token = crypto.randomUUID();
  adminSessions.add(token);
  res.json({ token, email: inputEmail });
});

router.post("/admin/logout", adminMiddleware, (req: Request, res: Response): void => {
  const token = req.headers["x-admin-token"] as string;
  adminSessions.delete(token);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/users", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const users = await db.select().from(nftUsers).orderBy(desc(nftUsers.registeredAt));
  res.json({ users: users.map(mapUser) });
});

router.patch("/admin/users/:id", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { field, value, reason } = req.body;

  if (field === "walletBalance") {
    const type = req.body.type as "add" | "sub";
    const amt = parseFloat(value) || 0;
    const [user] = await db.select({ walletBalance: nftUsers.walletBalance, name: nftUsers.name, email: nftUsers.email })
      .from(nftUsers).where(eq(nftUsers.id, id));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const current = num(user.walletBalance);
    const newBal = type === "add" ? current + amt : Math.max(0, current - amt);
    await db.update(nftUsers).set({ walletBalance: String(newBal) }).where(eq(nftUsers.id, id));
    await logAdmin(type === "add" ? "Add Balance" : "Deduct Balance", user.email, amt, reason || "");
    res.json({ ok: true, newBalance: newBal });
    return;
  }

  if (field === "isBlocked") {
    const [user] = await db.select({ email: nftUsers.email, isBlocked: nftUsers.isBlocked })
      .from(nftUsers).where(eq(nftUsers.id, id));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    await db.update(nftUsers).set({ isBlocked: !user.isBlocked }).where(eq(nftUsers.id, id));
    await logAdmin(user.isBlocked ? "Unblock User" : "Block User", user.email);
    res.json({ ok: true, isBlocked: !user.isBlocked });
    return;
  }

  if (field === "myReferralCode" || field === "referralCode") {
    const code = String(value).trim();
    const [taken] = await db.select({ id: nftUsers.id }).from(nftUsers)
      .where(eq(nftUsers.myReferralCode, code));
    if (taken && taken.id !== id) { res.status(409).json({ error: "Code already taken" }); return; }
    const [user] = await db.update(nftUsers).set({ myReferralCode: code })
      .where(eq(nftUsers.id, id)).returning({ email: nftUsers.email });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    await logAdmin("Update Referral Code", user.email, 0, `New: ${code}`);
    res.json({ ok: true });
    return;
  }

  res.status(400).json({ error: "Unknown field" });
});

router.delete("/admin/users/:id", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [user] = await db.select({ email: nftUsers.email }).from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await db.delete(nftUsers).where(eq(nftUsers.id, id));
  await logAdmin("Delete User", user.email);
  res.json({ ok: true });
});

// POST /api/nft/admin/deposit — manual deposit (add balance directly)
router.post("/admin/deposit", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId, amount, network, reason } = req.body;
  const amt = parseFloat(amount) || 0;
  if (!userId || amt <= 0) { res.status(400).json({ error: "userId and amount required" }); return; }

  const id = parseInt(userId);
  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const newWallet = num(user.walletBalance) + amt;
  const newNft    = num(user.nftAccountBalance) + amt;
  const newTotal  = num(user.totalDeposit) + amt;

  let newLevel = user.level;
  if (newTotal >= 500 && newLevel < 4) newLevel = 4;
  else if (newTotal >= 200 && newLevel < 3) newLevel = 3;
  else if (newTotal >= 50  && newLevel < 2) newLevel = 2;

  await db.update(nftUsers).set({
    walletBalance: String(newWallet),
    nftAccountBalance: String(newNft),
    totalDeposit: String(newTotal),
    level: newLevel,
  }).where(eq(nftUsers.id, id));

  await logAdmin("Process Deposit", user.email, amt, `Network: ${network ?? "manual"}, ${reason ?? ""}`);
  res.json({ ok: true });
});

// POST /api/nft/admin/airdrop
router.post("/admin/airdrop", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { amount } = req.body;
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) { res.status(400).json({ error: "Amount must be positive" }); return; }
  await db.execute(sql`UPDATE nft_users SET wallet_balance = wallet_balance + ${String(amt)}`);
  await logAdmin("Airdrop", "all_users", amt, `$${amt} to all users`);
  res.json({ ok: true });
});

// POST /api/nft/admin/notify
router.post("/admin/notify", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, message, type } = req.body;
  if (!title || !message) { res.status(400).json({ error: "Title and message required" }); return; }
  const [notif] = await db.insert(nftNotifications).values({ title, message, type: type ?? "info" }).returning();
  await logAdmin("Send Notification", "all", 0, title);
  res.json({ ok: true, notif });
});

// GET /api/nft/admin/notifications
router.get("/admin/notifications", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const notifs = await db.select().from(nftNotifications).orderBy(desc(nftNotifications.createdAt));
  res.json({ notifications: notifs });
});

// GET /api/nft/admin/logs
router.get("/admin/logs", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const logs = await db.select().from(nftAdminLogs).orderBy(desc(nftAdminLogs.createdAt)).limit(200);
  res.json({ logs });
});

// GET /api/nft/admin/settings
router.get("/admin/settings", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(nftSettings);
  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value; });
  res.json({ settings: map });
});

// PATCH /api/nft/admin/password
router.patch("/admin/password", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { newPassword, newEmail } = req.body;
  if (newPassword && newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    await db.insert(nftSettings).values({ key: "admin_password", value: hash })
      .onConflictDoUpdate({ target: nftSettings.key, set: { value: hash, updatedAt: new Date() } });
  }
  if (newEmail) {
    await db.insert(nftSettings).values({ key: "admin_email", value: newEmail.toLowerCase() })
      .onConflictDoUpdate({ target: nftSettings.key, set: { value: newEmail.toLowerCase(), updatedAt: new Date() } });
  }
  await logAdmin("Change Admin Password", "admin", 0, "Password/email updated");
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — DEPOSIT MANAGEMENT (pending deposit requests from users)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/nft/admin/deposits
router.get("/admin/deposits", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const deposits = await db.select().from(nftDeposits).orderBy(desc(nftDeposits.createdAt));
  res.json({
    deposits: deposits.map(d => ({
      ...d,
      amount: num(d.amount),
      createdAt: d.createdAt.toISOString(),
      processedAt: d.processedAt?.toISOString() ?? null,
    })),
  });
});

// PATCH /api/nft/admin/deposits/:id/approve
router.patch("/admin/deposits/:id/approve", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [dep] = await db.select().from(nftDeposits).where(eq(nftDeposits.id, id));
  if (!dep || dep.status !== "pending") {
    res.status(400).json({ error: "Deposit not found or already processed" }); return;
  }

  const amt = num(dep.amount);
  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, dep.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const newWallet = num(user.walletBalance) + amt;
  const newNft    = num(user.nftAccountBalance) + amt;
  const newTotal  = num(user.totalDeposit) + amt;

  let newLevel = user.level;
  if (newTotal >= 500 && newLevel < 4) newLevel = 4;
  else if (newTotal >= 200 && newLevel < 3) newLevel = 3;
  else if (newTotal >= 50  && newLevel < 2) newLevel = 2;

  await db.update(nftUsers).set({
    walletBalance: String(newWallet),
    nftAccountBalance: String(newNft),
    totalDeposit: String(newTotal),
    level: newLevel,
  }).where(eq(nftUsers.id, dep.userId));

  await db.update(nftDeposits)
    .set({ status: "approved", processedAt: new Date() })
    .where(eq(nftDeposits.id, id));

  await logAdmin("Approve Deposit", dep.userEmail, amt, `Network: ${dep.network}`);
  res.json({ ok: true });
});

// PATCH /api/nft/admin/deposits/:id/reject
router.patch("/admin/deposits/:id/reject", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { reason } = req.body;
  if (!reason?.trim()) { res.status(400).json({ error: "Reason required" }); return; }

  const [dep] = await db.select().from(nftDeposits).where(eq(nftDeposits.id, id));
  if (!dep || dep.status !== "pending") {
    res.status(400).json({ error: "Deposit not found or already processed" }); return;
  }

  await db.update(nftDeposits)
    .set({ status: "rejected", rejectReason: reason.trim(), processedAt: new Date() })
    .where(eq(nftDeposits.id, id));

  await logAdmin("Reject Deposit", dep.userEmail, num(dep.amount), reason.trim());
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — INCOME CONTROLS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/nft/admin/income — add reserve/team/referral income to user
router.post("/admin/income", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId, amount, incomeType } = req.body;
  const amt = parseFloat(amount) || 0;
  if (!userId || amt <= 0 || !incomeType) {
    res.status(400).json({ error: "userId, amount, and incomeType required" }); return;
  }

  const id = parseInt(userId);
  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const newWallet = num(user.walletBalance) + amt;

  if (incomeType === "reserve") {
    await db.update(nftUsers).set({
      walletBalance: String(newWallet),
      reserveIncome: String(num(user.reserveIncome) + amt),
    }).where(eq(nftUsers.id, id));
  } else if (incomeType === "team") {
    await db.update(nftUsers).set({
      walletBalance: String(newWallet),
      teamIncome: String(num(user.teamIncome) + amt),
    }).where(eq(nftUsers.id, id));
  } else {
    await db.update(nftUsers).set({
      walletBalance: String(newWallet),
      activityIncome: String(num(user.activityIncome) + amt),
    }).where(eq(nftUsers.id, id));
  }
  await logAdmin(`Add ${incomeType} Income`, user.email, amt, `Type: ${incomeType}`);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

router.get("/public/settings", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(nftSettings);
  const map: Record<string, string> = {};
  rows.forEach(s => { map[s.key] = s.value; });
  const safeKeys = [
    "platform_bep20_address", "platform_trc20_address",
    "withdraw_min_hours", "withdraw_max_hours",
    "withdraw_open_time", "withdraw_close_time", "withdraw_days",
    "deposit_bonus_pct", "referral_reward_pct", "reserve_reward_pct", "extra_bonus_pct",
  ];
  const result: Record<string, string> = {};
  safeKeys.forEach(k => { if (map[k] !== undefined) result[k] = map[k]; });
  res.json({ settings: result });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — FORGOT/RESET PASSWORD
// ══════════════════════════════════════════════════════════════════════════════

router.post("/admin/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  const normalEmail = email.toLowerCase().trim();
  const [dbAdminEmail] = await db.select({ value: nftSettings.value })
    .from(nftSettings).where(eq(nftSettings.key, "admin_email"));
  if (!ADMIN_EMAILS_LIST.includes(normalEmail) && dbAdminEmail?.value?.toLowerCase() !== normalEmail) {
    res.status(403).json({ error: "Not an authorized admin email" }); return;
  }
  const otp = genOtp();
  adminOtpStore.set(normalEmail, { otp, expires: Date.now() + 15 * 60 * 1000 });
  sendOtp(normalEmail, "Admin", otp, "Admin Panel Password Reset - THE SUPER NFT", "Your admin password reset code is:").catch(() => {});
  res.json({ ok: true });
});

router.post("/admin/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body as { email?: string; otp?: string; newPassword?: string };
  if (!email || !otp || !newPassword) { res.status(400).json({ error: "All fields required" }); return; }
  const normalEmail = email.toLowerCase().trim();
  const stored = adminOtpStore.get(normalEmail);
  if (!stored) { res.status(400).json({ error: "OTP not found. Request a new one." }); return; }
  if (Date.now() > stored.expires) { adminOtpStore.delete(normalEmail); res.status(400).json({ error: "expired" }); return; }
  if (stored.otp !== otp) { res.status(400).json({ error: "invalid" }); return; }
  adminOtpStore.delete(normalEmail);
  const hash = await bcrypt.hash(newPassword, 12);
  await db.insert(nftSettings).values({ key: "admin_password", value: hash })
    .onConflictDoUpdate({ target: nftSettings.key, set: { value: hash, updatedAt: new Date() } });
  res.json({ ok: true });
});

// PATCH /api/nft/admin/settings
router.patch("/admin/settings", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    if (typeof key === "string" && value !== undefined) {
      const v = String(value);
      await db.insert(nftSettings).values({ key, value: v })
        .onConflictDoUpdate({ target: nftSettings.key, set: { value: v, updatedAt: new Date() } });
    }
  }
  await logAdmin("Update Platform Settings", "admin", 0, Object.keys(updates).join(", "));
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — WITHDRAWALS
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/withdrawals", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const withdrawals = await db.select().from(nftWithdrawals).orderBy(desc(nftWithdrawals.requestedAt));
  res.json({ withdrawals: withdrawals.map(w => ({
    ...w,
    amount: num(w.amount),
    requestedAt: w.requestedAt.toISOString(),
    processedAt: w.processedAt?.toISOString() ?? null,
  })) });
});

router.patch("/admin/withdrawals/:id/approve", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { txHash } = req.body;
  if (!txHash?.trim()) { res.status(400).json({ error: "TX hash required" }); return; }
  const [wd] = await db.select().from(nftWithdrawals).where(eq(nftWithdrawals.id, id));
  if (!wd || wd.status !== "pending") { res.status(400).json({ error: "Withdrawal not found or already processed" }); return; }
  const amt = num(wd.amount);
  await db.update(nftWithdrawals).set({ status: "approved", txHash: txHash.trim(), processedAt: new Date() })
    .where(eq(nftWithdrawals.id, id));
  await db.execute(sql`UPDATE nft_users SET total_withdraw = total_withdraw + ${String(amt)} WHERE id = ${wd.userId}`);
  await logAdmin("Approve Withdrawal", wd.userEmail, amt, `TX: ${txHash.trim()}`);
  res.json({ ok: true });
});

router.patch("/admin/withdrawals/:id/reject", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { reason } = req.body;
  if (!reason?.trim()) { res.status(400).json({ error: "Reason required" }); return; }
  const [wd] = await db.select().from(nftWithdrawals).where(eq(nftWithdrawals.id, id));
  if (!wd || wd.status !== "pending") { res.status(400).json({ error: "Withdrawal not found or already processed" }); return; }
  const amt = num(wd.amount);
  await db.update(nftWithdrawals).set({ status: "rejected", rejectReason: reason.trim(), processedAt: new Date() })
    .where(eq(nftWithdrawals.id, id));
  await db.execute(sql`UPDATE nft_users SET wallet_balance = wallet_balance + ${String(amt)} WHERE id = ${wd.userId}`);
  await logAdmin("Reject Withdrawal", wd.userEmail, amt, reason.trim());
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER ROUTES
// ══════════════════════════════════════════════════════════════════════════════

router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const result = await db.execute(sql`
    SELECT
      -- Level 1: direct referrals (A enthusiasts)
      (SELECT COUNT(*) FROM nft_users
         WHERE joined_with_code = ${user.myReferralCode})::int                                               AS team_count,

      -- Valid members: level-1 referrals with at least one approved deposit
      (SELECT COUNT(DISTINCT u.id) FROM nft_users u
         INNER JOIN nft_deposits d ON d.user_id = u.id AND d.status = 'approved'
         WHERE u.joined_with_code = ${user.myReferralCode})::int                                             AS valid_members,

      -- B enthusiasts: level-2 total referrals without deposit filter
(SELECT COUNT(*) FROM nft_users p2
INNER JOIN nft_users p1 ON p1.my_referral_code = p2.joined_with_code
WHERE p1.joined_with_code = ${user.myReferralCode})::int
AS b_enthusiasts,

      -- C enthusiasts: level-3 referrals with approved deposits
      (SELECT COUNT(DISTINCT p3.id) FROM nft_users p3
         INNER JOIN nft_users p2 ON p2.my_referral_code = p3.joined_with_code
         INNER JOIN nft_users p1 ON p1.my_referral_code = p2.joined_with_code
         INNER JOIN nft_deposits d ON d.user_id = p3.id AND d.status = 'approved'
         WHERE p1.joined_with_code = ${user.myReferralCode})::int                                            AS c_enthusiasts,

      -- Order counters for this user
      (SELECT COUNT(*) FROM nft_deposits   WHERE user_id = ${id})::int                                       AS total_orders,
      (SELECT COUNT(*) FROM nft_deposits   WHERE user_id = ${id} AND status = 'pending')::int                AS proc_orders,
      (SELECT COUNT(*) FROM nft_deposits   WHERE user_id = ${id} AND status = 'approved')::int               AS bought_count,
      (SELECT COUNT(*) FROM nft_withdrawals WHERE user_id = ${id} AND status = 'approved')::int              AS sold_count
  `);

  const c = (result.rows?.[0] ?? (result as unknown as unknown[])[0] ?? {}) as Record<string, unknown>;
  const bEnt = Number(c["b_enthusiasts"] ?? 0);
  const cEnt = Number(c["c_enthusiasts"] ?? 0);
  res.json({
    user: {
      ...mapUser(user),
      teamCount:        Number(c["team_count"]    ?? 0),
      validMembers:     Number(c["valid_members"]  ?? 0),
      aEnthusiasts:     Number(c["team_count"]    ?? 0),
      bEnthusiasts:     bEnt,
      cEnthusiasts:     cEnt,
      bcEnthusiasts:    bEnt + cEnt,
      totalOrders:      Number(c["total_orders"]  ?? 0),
      processingOrders: Number(c["proc_orders"]   ?? 0),
      boughtCount:      Number(c["bought_count"]  ?? 0),
      soldCount:        Number(c["sold_count"]    ?? 0),
    },
  });
});

router.get("/users/:id/team", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [me] = await db.select({ myReferralCode: nftUsers.myReferralCode }).from(nftUsers).where(eq(nftUsers.id, id));
  if (!me) { res.status(404).json({ error: "User not found" }); return; }
  const team = await db.select().from(nftUsers)
    .where(eq(nftUsers.joinedWithCode, me.myReferralCode))
    .orderBy(desc(nftUsers.registeredAt));
  res.json({ team: team.map(mapUser), referralCode: me.myReferralCode });
});

// PATCH /users/:id/address — bind BEP20 or TRC20 withdrawal address
router.patch("/users/:id/address", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { address, network } = req.body;
  if (!address?.trim()) { res.status(400).json({ error: "Address required" }); return; }

  const net = (network || "TRC20").toUpperCase();
  if (net === "BEP20") {
    await db.update(nftUsers).set({
      withdrawalAddress: address.trim(),
      addressBindDate: new Date(),
      bep20Address: address.trim(),
    }).where(eq(nftUsers.id, id));
  } else {
    await db.update(nftUsers).set({
      withdrawalAddress: address.trim(),
      addressBindDate: new Date(),
      trc20Address: address.trim(),
    }).where(eq(nftUsers.id, id));
  }
  res.json({ ok: true });
});

router.patch("/users/:id/google-auth", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { enabled } = req.body;
  await db.update(nftUsers).set({ googleAuthBound: Boolean(enabled) }).where(eq(nftUsers.id, id));
  res.json({ ok: true });
});

// POST /users/:id/withdraw
router.post("/users/:id/withdraw", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { amount, network, address } = req.body;
  const amt = parseFloat(amount) || 0;
  const net = (network || "TRC20").toUpperCase() as "BEP20" | "TRC20";

  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.isBlocked) { res.status(403).json({ error: "blocked" }); return; }

  const withdrawAddr = (address as string | undefined)?.trim()
    || (net === "BEP20" ? user.bep20Address : user.trc20Address);
  if (!withdrawAddr) { res.status(400).json({ error: "no_address" }); return; }
  if (amt < 10) { res.status(400).json({ error: "min" }); return; }
  if (amt > num(user.walletBalance)) { res.status(400).json({ error: "insufficient" }); return; }

  const newBal = num(user.walletBalance) - amt;
  await db.update(nftUsers).set({ walletBalance: String(newBal) }).where(eq(nftUsers.id, id));
  await db.insert(nftWithdrawals).values({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    amount: String(amt),
    address: withdrawAddr,
    network: net,
  });

  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER DEPOSITS (pending requests)
// ══════════════════════════════════════════════════════════════════════════════

// POST /me/deposits — user submits deposit request
router.post("/me/deposits", async (req: Request, res: Response): Promise<void> => {
  const { userId, amount, network, txHash } = req.body;
  const amt = parseFloat(amount) || 0;
  if (!userId || amt <= 0) { res.status(400).json({ error: "userId and amount required" }); return; }

  const id = parseInt(userId);
  const [user] = await db.select({
    id: nftUsers.id, email: nftUsers.email, name: nftUsers.name, isBlocked: nftUsers.isBlocked,
  }).from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.isBlocked) { res.status(403).json({ error: "Account is blocked" }); return; }

  const [dep] = await db.insert(nftDeposits).values({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    amount: String(amt),
    network: (network || "BEP20").toUpperCase(),
    txHash: txHash?.trim() || null,
    status: "pending",
  }).returning();

  res.json({ ok: true, depositId: dep.id });
});

// GET /me/deposits?userId=X — user deposit history
router.get("/me/deposits", async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.query["userId"] as string);
  if (!userId) { res.json({ deposits: [] }); return; }
  const deposits = await db.select().from(nftDeposits)
    .where(eq(nftDeposits.userId, userId))
    .orderBy(desc(nftDeposits.createdAt));
  res.json({
    deposits: deposits.map(d => ({
      ...d,
      amount: num(d.amount),
      createdAt: d.createdAt.toISOString(),
      processedAt: d.processedAt?.toISOString() ?? null,
    })),
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS (user-facing)
// ══════════════════════════════════════════════════════════════════════════════

router.get("/notifications", async (_req: Request, res: Response): Promise<void> => {
  const notifs = await db.select().from(nftNotifications).orderBy(desc(nftNotifications.createdAt)).limit(50);
  res.json({ notifications: notifs.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    read: [] as string[],
  })) });
});

// ══════════════════════════════════════════════════════════════════════════════
// NFT ORDERS
// ══════════════════════════════════════════════════════════════════════════════

router.get("/me/orders", async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.query["userId"] as string);
  if (!userId) { res.json({ orders: [] }); return; }
  const orders = await db.select().from(nftOrders)
    .where(eq(nftOrders.userId, userId))
    .orderBy(desc(nftOrders.createdAt));
  res.json({
    orders: orders.map(o => ({
      ...o,
      nftPrice: num(o.nftPrice),
      createdAt: o.createdAt.toISOString(),
      soldAt: o.soldAt?.toISOString() ?? null,
    })),
  });
});

router.post("/me/orders", async (req: Request, res: Response): Promise<void> => {
  const { userId, nftName, nftImage, nftPrice } = req.body;
  if (!userId || !nftName || !nftPrice) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const uid = parseInt(userId);
  const price = num(nftPrice);
  const [user] = await db.select({ walletBalance: nftUsers.walletBalance })
    .from(nftUsers).where(eq(nftUsers.id, uid));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (num(user.walletBalance) < price) { res.status(400).json({ error: "insufficient" }); return; }
  await db.update(nftUsers)
    .set({ walletBalance: String(num(user.walletBalance) - price) })
    .where(eq(nftUsers.id, uid));
  const [order] = await db.insert(nftOrders).values({
    userId: uid, nftName, nftImage: nftImage ?? "", nftPrice: String(price),
  }).returning();
  res.json({ ok: true, order: { ...order, nftPrice: num(order.nftPrice), createdAt: order.createdAt.toISOString(), soldAt: null } });
});

/* ── POST /announcements — Admin posts via service role (bypasses RLS) ── */
router.post("/announcements", async (req: Request, res: Response): Promise<void> => {
  const authHeader = (req.headers["authorization"] ?? "") as string;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const serviceKey  = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!supabaseUrl || !serviceKey) { res.status(500).json({ error: "Supabase not configured" }); return; }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !user) { res.status(401).json({ error: "Invalid token" }); return; }

  const { data: profile } = await adminClient.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { title, message } = req.body as { title?: string; message?: string };
  if (!message?.trim()) { res.status(400).json({ error: "Message required" }); return; }

  const { error } = await adminClient.from("announcements").insert({
    title:      (title?.trim() || "Announcement"),
    message:    message.trim(),
    created_by: user.id,
    is_active:  true,
  });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

router.put("/me/orders/:id/sell", async (req: Request, res: Response): Promise<void> => {
  const orderId = parseInt(req.params["id"] as string);
  const userId = parseInt(req.body.userId);
  const [order] = await db.select().from(nftOrders).where(eq(nftOrders.id, orderId));
  if (!order || order.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.status === "sold") { res.status(400).json({ error: "Already sold" }); return; }
  const price = num(order.nftPrice);
  const [user] = await db.select({ walletBalance: nftUsers.walletBalance })
    .from(nftUsers).where(eq(nftUsers.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await db.update(nftUsers)
    .set({ walletBalance: String(num(user.walletBalance) + price) })
    .where(eq(nftUsers.id, userId));
  await db.update(nftOrders)
    .set({ status: "sold", soldAt: new Date() })
    .where(eq(nftOrders.id, orderId));
  res.json({ ok: true });
});

export default router;
