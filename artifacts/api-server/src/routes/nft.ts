import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  db,
  nftUsers, nftSettings, nftReferrals, nftWithdrawals,
  nftNotifications, nftAdminLogs,
} from "@workspace/db";

const router: IRouter = Router();

// ── In-memory admin sessions ──────────────────────────────────────────────────
const adminSessions = new Set<string>();

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
    level: u.level,
    isAdmin: u.isAdmin,
    isBlocked: u.isBlocked,
    googleAuthBound: u.googleAuthBound,
    googleAuthSecret: null as null,
    withdrawalAddress: u.withdrawalAddress ?? null,
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

// POST /api/nft/auth/register
router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, country, referralCode } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }

  const [existing] = await db.select({ id: nftUsers.id }).from(nftUsers)
    .where(eq(nftUsers.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "Email already registered. Please login." }); return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const myReferralCode = await genReferralCode(name);

  // Accept ?ref=userId (all digits) OR ?ref=referralCode (alphanumeric)
  let joinedWithCode: string | null = null;
  const refParam = referralCode?.trim();
  if (refParam) {
    if (/^\d+$/.test(refParam)) {
      const [referrer] = await db.select({ myReferralCode: nftUsers.myReferralCode })
        .from(nftUsers).where(eq(nftUsers.id, parseInt(refParam)));
      if (referrer) joinedWithCode = referrer.myReferralCode;
    } else {
      joinedWithCode = refParam;
    }
  }

  const [user] = await db.insert(nftUsers).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    username: email.split("@")[0],
    phone: phone ?? null,
    country: country ?? null,
    myReferralCode,
    joinedWithCode,
  }).returning();

  if (joinedWithCode) {
    await db.insert(nftReferrals).values({
      referrerCode: joinedWithCode,
      newUserEmail: email.toLowerCase(),
      newUserId: user.id,
    }).onConflictDoNothing();
  }

  req.log.info({ userId: user.id, email }, "NFT user registered");
  res.json({ user: mapUser(user) });
});

// POST /api/nft/auth/login
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" }); return;
  }

  const [user] = await db.select().from(nftUsers)
    .where(eq(nftUsers.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" }); return;
  }
  if (user.isBlocked) {
    res.status(403).json({ error: "Account blocked. Contact support." }); return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" }); return;
  }

  await db.update(nftUsers).set({ lastLogin: new Date() }).where(eq(nftUsers.id, user.id));

  req.log.info({ userId: user.id, email }, "NFT user logged in");
  res.json({ user: mapUser({ ...user, lastLogin: new Date() }) });
});

// POST /api/nft/auth/forgot-password
router.post("/auth/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email?.trim()) { res.status(400).json({ error: "Email required" }); return; }

  const [user] = await db.select({ id: nftUsers.id, email: nftUsers.email, name: nftUsers.name })
    .from(nftUsers).where(eq(nftUsers.email, email.toLowerCase().trim()));

  // Always return ok — never reveal if email exists
  if (!user) { res.json({ ok: true }); return; }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(nftUsers)
    .set({ resetToken: token, resetTokenExpiry: expiry })
    .where(eq(nftUsers.id, user.id));

  const appUrl = process.env["APP_URL"] || "https://34us.pike.replit.dev";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const emailUser = process.env["EMAIL_USER"];
  const emailPass = process.env["EMAIL_PASS"];

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      });
      await transporter.sendMail({
        from: `"THE SUPER NFT" <${emailUser}>`,
        to: user.email,
        subject: "Password Reset - THE SUPER NFT",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#f8f9fa;border-radius:12px;padding:32px;">
            <h2 style="color:#1E3A8A;text-align:center;">THE SUPER NFT</h2>
            <p style="color:#333;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#555;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="background:#1E3A8A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
            </div>
            <p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#bbb;font-size:11px;text-align:center;">THE SUPER NFT · Community World</p>
          </div>
        `,
      });
      req.log.info({ userId: user.id }, "Password reset email sent");
    } catch (e) {
      req.log.error({ err: e }, "Failed to send reset email");
      req.log.info({ resetUrl }, "Reset URL fallback (email failed)");
    }
  } else {
    req.log.warn({ resetUrl }, "EMAIL_USER/EMAIL_PASS not set — reset URL logged only");
  }

  res.json({ ok: true });
});

// POST /api/nft/auth/reset-password
router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!token?.trim() || !password) { res.status(400).json({ error: "Token and password required" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }

  const [user] = await db.select({
    id: nftUsers.id, resetToken: nftUsers.resetToken, resetTokenExpiry: nftUsers.resetTokenExpiry,
  }).from(nftUsers).where(eq(nftUsers.resetToken, token.trim()));

  if (!user) { res.status(400).json({ error: "Invalid or expired reset link" }); return; }
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Reset link has expired. Please request a new one." }); return;
  }

  const hash = await bcrypt.hash(password, 10);
  await db.update(nftUsers)
    .set({ passwordHash: hash, resetToken: null, resetTokenExpiry: null })
    .where(eq(nftUsers.id, user.id));

  req.log.info({ userId: user.id }, "Password reset successful");
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ══════════════════════════════════════════════════════════════════════════════

// Authorized admin emails (both can log in with the admin password)
const ADMIN_EMAILS = [
  "businesstech10002@gmail.com",
  "thesupernftref88rk56@gmail.com",
];

// POST /api/nft/admin/login
router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const inputEmail = email?.toLowerCase()?.trim() ?? "";
  if (!ADMIN_EMAILS.includes(inputEmail)) {
    res.status(401).json({ error: "Invalid admin credentials" }); return;
  }

  const [passSetting] = await db.select().from(nftSettings)
    .where(eq(nftSettings.key, "admin_password"));

  if (!passSetting) {
    res.status(500).json({ error: "Admin not configured" }); return;
  }

  const valid = await bcrypt.compare(password, passSetting.value);
  if (!valid) {
    res.status(401).json({ error: "Invalid admin credentials" }); return;
  }

  const token = crypto.randomUUID();
  adminSessions.add(token);
  req.log.info({ email: inputEmail }, "Admin logged in");
  res.json({ token, email: inputEmail });
});

// POST /api/nft/admin/logout
router.post("/admin/logout", adminMiddleware, (req: Request, res: Response): void => {
  const token = req.headers["x-admin-token"] as string;
  adminSessions.delete(token);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/nft/admin/users
router.get("/admin/users", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const users = await db.select().from(nftUsers).orderBy(desc(nftUsers.registeredAt));
  res.json({ users: users.map(mapUser) });
});

// PATCH /api/nft/admin/users/:id
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

// DELETE /api/nft/admin/users/:id
router.delete("/admin/users/:id", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [user] = await db.select({ email: nftUsers.email }).from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await db.delete(nftUsers).where(eq(nftUsers.id, id));
  await logAdmin("Delete User", user.email);
  res.json({ ok: true });
});

// POST /api/nft/admin/deposit — add balance to a user (manual deposit)
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

  await db.execute(
    sql`UPDATE nft_users SET wallet_balance = wallet_balance + ${String(amt)}`
  );
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

// PATCH /api/nft/admin/password — change admin panel password
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
// ADMIN — WITHDRAWALS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/nft/admin/withdrawals
router.get("/admin/withdrawals", adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const withdrawals = await db.select().from(nftWithdrawals).orderBy(desc(nftWithdrawals.requestedAt));
  res.json({ withdrawals: withdrawals.map(w => ({
    ...w,
    amount: num(w.amount),
    requestedAt: w.requestedAt.toISOString(),
    processedAt: w.processedAt?.toISOString() ?? null,
  })) });
});

// PATCH /api/nft/admin/withdrawals/:id/approve
router.patch("/admin/withdrawals/:id/approve", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { txHash } = req.body;
  if (!txHash?.trim()) { res.status(400).json({ error: "TX hash required" }); return; }

  const [wd] = await db.select().from(nftWithdrawals).where(eq(nftWithdrawals.id, id));
  if (!wd || wd.status !== "pending") { res.status(400).json({ error: "Withdrawal not found or already processed" }); return; }

  const amt = num(wd.amount);
  await db.update(nftWithdrawals).set({ status: "approved", txHash: txHash.trim(), processedAt: new Date() })
    .where(eq(nftWithdrawals.id, id));
  await db.execute(
    sql`UPDATE nft_users SET total_withdraw = total_withdraw + ${String(amt)} WHERE id = ${wd.userId}`
  );
  await logAdmin("Approve Withdrawal", wd.userEmail, amt, `TX: ${txHash.trim()}`);
  res.json({ ok: true });
});

// PATCH /api/nft/admin/withdrawals/:id/reject
router.patch("/admin/withdrawals/:id/reject", adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { reason } = req.body;
  if (!reason?.trim()) { res.status(400).json({ error: "Reason required" }); return; }

  const [wd] = await db.select().from(nftWithdrawals).where(eq(nftWithdrawals.id, id));
  if (!wd || wd.status !== "pending") { res.status(400).json({ error: "Withdrawal not found or already processed" }); return; }

  const amt = num(wd.amount);
  await db.update(nftWithdrawals).set({ status: "rejected", rejectReason: reason.trim(), processedAt: new Date() })
    .where(eq(nftWithdrawals.id, id));
  // Refund balance
  await db.execute(
    sql`UPDATE nft_users SET wallet_balance = wallet_balance + ${String(amt)} WHERE id = ${wd.userId}`
  );
  await logAdmin("Reject Withdrawal", wd.userEmail, amt, reason.trim());
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/nft/users/:id
router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user: mapUser(user) });
});

// GET /api/nft/users/:id/team — downline
router.get("/users/:id/team", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const [me] = await db.select({ myReferralCode: nftUsers.myReferralCode }).from(nftUsers).where(eq(nftUsers.id, id));
  if (!me) { res.status(404).json({ error: "User not found" }); return; }

  const team = await db.select().from(nftUsers)
    .where(eq(nftUsers.joinedWithCode, me.myReferralCode))
    .orderBy(desc(nftUsers.registeredAt));
  res.json({ team: team.map(mapUser), referralCode: me.myReferralCode });
});

// PATCH /api/nft/users/:id/address — bind withdrawal address
router.patch("/users/:id/address", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { address } = req.body;
  if (!address?.trim()) { res.status(400).json({ error: "Address required" }); return; }
  await db.update(nftUsers).set({ withdrawalAddress: address.trim(), addressBindDate: new Date() })
    .where(eq(nftUsers.id, id));
  res.json({ ok: true });
});

// PATCH /api/nft/users/:id/google-auth — toggle Google Auth
router.patch("/users/:id/google-auth", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { enabled } = req.body;
  await db.update(nftUsers).set({ googleAuthBound: Boolean(enabled) }).where(eq(nftUsers.id, id));
  res.json({ ok: true });
});

// POST /api/nft/users/:id/withdraw — submit withdrawal request
router.post("/users/:id/withdraw", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  const { amount } = req.body;
  const amt = parseFloat(amount) || 0;

  const [user] = await db.select().from(nftUsers).where(eq(nftUsers.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.isBlocked) { res.status(403).json({ error: "blocked" }); return; }
  if (!user.withdrawalAddress) { res.status(400).json({ error: "no_address" }); return; }
  if (amt < 10) { res.status(400).json({ error: "min" }); return; }
  if (amt > num(user.walletBalance)) { res.status(400).json({ error: "insufficient" }); return; }

  // Deduct balance
  const newBal = num(user.walletBalance) - amt;
  await db.update(nftUsers).set({ walletBalance: String(newBal) }).where(eq(nftUsers.id, id));
  await db.insert(nftWithdrawals).values({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    amount: String(amt),
    address: user.withdrawalAddress,
  });

  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS (for regular users)
// ══════════════════════════════════════════════════════════════════════════════

router.get("/notifications", async (_req: Request, res: Response): Promise<void> => {
  const notifs = await db.select().from(nftNotifications).orderBy(desc(nftNotifications.createdAt)).limit(50);
  res.json({ notifications: notifs.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    read: [] as string[],
  })) });
});

export default router;
