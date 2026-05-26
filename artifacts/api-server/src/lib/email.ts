import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "noreply@example.com";

  if (!host || !user || !pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return { transporter, from };
}

export async function sendVerificationEmail(email: string, code: string, fullName: string): Promise<void> {
  logger.info({ email }, "Sending verification email");

  const smtp = createTransporter();

  if (!smtp) {
    logger.warn({ email, code }, "SMTP not configured — verification code logged for development");
    logger.info({ email, code }, `[DEV] Verification code for ${email}: ${code}`);
    return;
  }

  await smtp.transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="color: #a855f7; margin-bottom: 8px;">Verify Your Email</h1>
        <p style="color: #c4b5fd; margin-bottom: 24px;">Hi ${fullName}, use the code below to complete your registration.</p>
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #fff;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  logger.info({ email }, "Verification email sent");
}
