import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, pendingVerificationsTable } from "@workspace/db";
import {
  RegisterUserBody,
  VerifyCodeBody,
  ResendCodeBody,
} from "@workspace/api-zod";
import { sendVerificationEmail } from "../lib/email";

const router: IRouter = Router();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, username, email, confirmEmail, phoneCountryCode, phoneNumber, referralCode } = parsed.data;

  if (email !== confirmEmail) {
    res.status(400).json({ error: "Emails do not match" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id, email: usersTable.email, username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const existingUsername = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existingUsername.length > 0) {
    res.status(409).json({ error: "This username is already taken" });
    return;
  }

  await db
    .delete(pendingVerificationsTable)
    .where(eq(pendingVerificationsTable.email, email));

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const userData = JSON.stringify({ fullName, username, email, phoneCountryCode, phoneNumber, referralCode: referralCode ?? null });

  await db.insert(pendingVerificationsTable).values({
    email,
    code,
    userData,
    expiresAt,
  });

  await sendVerificationEmail(email, code, fullName);

  req.log.info({ email }, "Registration initiated, verification email sent");
  res.json({ message: "Verification code sent to your email", email });
});

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
    .where(
      and(
        eq(pendingVerificationsTable.email, email),
        gt(pendingVerificationsTable.expiresAt, new Date())
      )
    );

  if (!pending) {
    res.status(400).json({ error: "No pending verification found or it has expired. Please register again." });
    return;
  }

  if (pending.code !== code) {
    res.status(400).json({ error: "Invalid verification code. Please try again." });
    return;
  }

  let userData: { fullName: string; username: string; email: string; phoneCountryCode: string; phoneNumber: string; referralCode: string | null };
  try {
    userData = JSON.parse(pending.userData);
  } catch {
    res.status(400).json({ error: "Invalid registration data. Please register again." });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      phoneCountryCode: userData.phoneCountryCode,
      phoneNumber: userData.phoneNumber,
      referralCode: userData.referralCode,
    })
    .returning();

  await db
    .delete(pendingVerificationsTable)
    .where(eq(pendingVerificationsTable.email, email));

  req.log.info({ userId: user.id, email }, "User registered successfully");
  res.json({
    message: "Registration successful! Welcome aboard.",
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneCountryCode: user.phoneCountryCode,
      phoneNumber: user.phoneNumber,
      referralCode: user.referralCode,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/resend", async (req, res): Promise<void> => {
  const parsed = ResendCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;

  const [pending] = await db
    .select()
    .from(pendingVerificationsTable)
    .where(eq(pendingVerificationsTable.email, email));

  if (!pending) {
    res.status(400).json({ error: "No pending registration found for this email. Please register again." });
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .update(pendingVerificationsTable)
    .set({ code, expiresAt })
    .where(eq(pendingVerificationsTable.email, email));

  let fullName = "User";
  try {
    const userData = JSON.parse(pending.userData);
    fullName = userData.fullName || "User";
  } catch {}

  await sendVerificationEmail(email, code, fullName);

  req.log.info({ email }, "Verification code resent");
  res.json({ message: "A new verification code has been sent to your email", email });
});

export default router;
