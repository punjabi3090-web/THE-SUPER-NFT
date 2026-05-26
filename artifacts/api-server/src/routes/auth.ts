import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, pendingVerificationsTable, passwordResetTokensTable } from "@workspace/db";
import {
  RegisterUserBody,
  VerifyCodeBody,
  ResendCodeBody,
  LoginUserBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Register ────────────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, username, email, confirmEmail, phoneCountryCode, phoneNumber, referralCode, password, confirmPassword } = parsed.data;

  if (email !== confirmEmail) {
    res.status(400).json({ error: "Email addresses do not match" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  const existingEmail = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const existingUsername = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername.length > 0) {
    res.status(409).json({ error: "This username is already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.delete(pendingVerificationsTable).where(eq(pendingVerificationsTable.email, email));

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const userData = JSON.stringify({ fullName, username, email, phoneCountryCode, phoneNumber, referralCode: referralCode ?? null, passwordHash });

  await db.insert(pendingVerificationsTable).values({ email, code, userData, expiresAt });
  await sendVerificationEmail(email, code, fullName);

  req.log.info({ email }, "Registration initiated");
  res.json({ message: "Verification code sent to your email", email });
});

// ─── Verify OTP ──────────────────────────────────────────────────────────────

router.post("/auth/verify", async (req, res): Promise<void> => {
  const parsed = VerifyCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, code } = parsed.data;

  const [pending] = await db
    .select()
    .from(pendingVerificationsTable)
    .where(and(eq(pendingVerificationsTable.email, email), gt(pendingVerificationsTable.expiresAt, new Date())));

  if (!pending) {
    res.status(400).json({ error: "No pending verification found or it has expired. Please register again." });
    return;
  }

  if (pending.code !== code) {
    res.status(400).json({ error: "Invalid verification code. Please try again." });
    return;
  }

  let userData: { fullName: string; username: string; email: string; phoneCountryCode: string; phoneNumber: string; referralCode: string | null; passwordHash: string };
  try {
    userData = JSON.parse(pending.userData);
  } catch {
    res.status(400).json({ error: "Invalid registration data. Please register again." });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    fullName: userData.fullName,
    username: userData.username,
    email: userData.email,
    phoneCountryCode: userData.phoneCountryCode,
    phoneNumber: userData.phoneNumber,
    referralCode: userData.referralCode,
    passwordHash: userData.passwordHash,
  }).returning();

  await db.delete(pendingVerificationsTable).where(eq(pendingVerificationsTable.email, email));

  req.log.info({ userId: user.id, email }, "User registered successfully");
  res.json({
    message: "Registration successful! Welcome aboard.",
    user: { id: user.id, fullName: user.fullName, username: user.username, email: user.email, phoneCountryCode: user.phoneCountryCode, phoneNumber: user.phoneNumber, referralCode: user.referralCode, createdAt: user.createdAt.toISOString() },
  });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────

router.post("/auth/resend", async (req, res): Promise<void> => {
  const parsed = ResendCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;
  const [pending] = await db.select().from(pendingVerificationsTable).where(eq(pendingVerificationsTable.email, email));

  if (!pending) {
    res.status(400).json({ error: "No pending registration found for this email. Please register again." });
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.update(pendingVerificationsTable).set({ code, expiresAt }).where(eq(pendingVerificationsTable.email, email));

  let fullName = "User";
  try { fullName = JSON.parse(pending.userData).fullName || "User"; } catch {}

  await sendVerificationEmail(email, code, fullName);
  req.log.info({ email }, "Verification code resent");
  res.json({ message: "A new verification code has been sent to your email", email });
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.log.info({ userId: user.id, email }, "User logged in");
  res.json({
    message: "Login successful",
    user: { id: user.id, fullName: user.fullName, username: user.username, email: user.email, phoneCountryCode: user.phoneCountryCode, phoneNumber: user.phoneNumber, referralCode: user.referralCode, createdAt: user.createdAt.toISOString() },
  });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid email address" });
    return;
  }

  const { email } = parsed.data;
  const [user] = await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.email, email));

  // Always respond with success to avoid email enumeration
  if (!user) {
    res.json({ message: "If an account with that email exists, a reset code has been sent." });
    return;
  }

  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.email, email));

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(passwordResetTokensTable).values({ email, code, expiresAt });

  await sendPasswordResetEmail(email, code, user.fullName);

  req.log.info({ email }, "Password reset code sent");
  res.json({ message: "If an account with that email exists, a reset code has been sent." });
});

// ─── Reset Password ───────────────────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, code, newPassword, confirmNewPassword } = parsed.data;

  if (newPassword !== confirmNewPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  const [token] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.email, email), gt(passwordResetTokensTable.expiresAt, new Date())));

  if (!token) {
    res.status(400).json({ error: "Invalid or expired reset code. Please request a new one." });
    return;
  }

  if (token.code !== code) {
    res.status(400).json({ error: "Invalid reset code. Please try again." });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.email, email));
  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.email, email));

  req.log.info({ email }, "Password reset successfully");
  res.json({ message: "Password updated successfully" });
});

export default router;
