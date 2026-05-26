import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return { transporter, from: from || "noreply@example.com" };
}

function codeDigits(code: string): string {
  return code
    .split("")
    .map(
      (d) =>
        `<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:60px;margin:0 4px;background:rgba(168,85,247,0.15);border:2px solid rgba(168,85,247,0.4);border-radius:10px;font-size:32px;font-weight:800;color:#fff;font-family:monospace;letter-spacing:0;">${d}</span>`
    )
    .join("");
}

function buildEmailHtml(opts: {
  title: string;
  greeting: string;
  bodyText: string;
  code: string;
  note: string;
  footerNote: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#050510;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050510;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%);border:1px solid rgba(168,85,247,0.25);border-radius:20px;overflow:hidden;">

          <!-- Header gradient bar -->
          <tr>
            <td style="height:5px;background:linear-gradient(90deg,#7c3aed,#a855f7,#d946ef);"></td>
          </tr>

          <!-- Logo / brand area -->
          <tr>
            <td align="center" style="padding:36px 40px 20px;">
              <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:16px;line-height:56px;font-size:28px;text-align:center;box-shadow:0 0 30px rgba(168,85,247,0.5);">✦</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 40px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${opts.title}</h1>
            </td>
          </tr>

          <!-- Greeting / body text -->
          <tr>
            <td style="padding:16px 40px 32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#c4b5fd;text-align:center;">${opts.greeting}</p>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.6;">${opts.bodyText}</p>
            </td>
          </tr>

          <!-- Code block -->
          <tr>
            <td align="center" style="padding:0 40px 12px;">
              <div style="background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1));border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:28px 20px;display:inline-block;width:100%;box-sizing:border-box;">
                <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;text-align:center;">Your verification code</p>
                <div style="text-align:center;line-height:1;">${codeDigits(opts.code)}</div>
              </div>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding:20px 40px 8px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;">${opts.note}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,0.3),transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 36px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.7;">${opts.footerNote}</p>
            </td>
          </tr>

          <!-- Bottom gradient bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent,rgba(168,85,247,0.5),transparent);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  fullName: string
): Promise<void> {
  const html = buildEmailHtml({
    title: "Your Secure Registration Code",
    greeting: `Hi ${fullName},`,
    bodyText:
      "You're almost there! Use the 6-digit code below to verify your email and complete your registration.",
    code,
    note: "This code expires in <strong style='color:rgba(255,255,255,0.6);'>10 minutes</strong>. Do not share it with anyone.",
    footerNote:
      "If you didn't create an account, you can safely ignore this email.<br/>This message was sent automatically — please do not reply.",
  });

  await sendEmail({
    to: email,
    subject: "Your Secure Registration Code",
    html,
    fallbackLog: `[DEV] Registration OTP for ${email}: ${code}`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  fullName: string
): Promise<void> {
  const html = buildEmailHtml({
    title: "Password Reset Code",
    greeting: `Hi ${fullName},`,
    bodyText:
      "We received a request to reset your password. Use the code below to set a new password. If you didn't request this, you can ignore this email.",
    code,
    note: "This code expires in <strong style='color:rgba(255,255,255,0.6);'>10 minutes</strong>. Do not share it with anyone.",
    footerNote:
      "If you didn't request a password reset, your account is safe — no changes were made.<br/>This message was sent automatically — please do not reply.",
  });

  await sendEmail({
    to: email,
    subject: "Your Password Reset Code",
    html,
    fallbackLog: `[DEV] Password reset OTP for ${email}: ${code}`,
  });
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  fallbackLog: string;
}): Promise<void> {
  const smtp = createTransporter();

  if (!smtp) {
    logger.warn(
      { email: opts.to },
      "SMTP not configured — code logged to console (set EMAIL_HOST, EMAIL_USER, EMAIL_PASS)"
    );
    logger.info(opts.fallbackLog);
    return;
  }

  try {
    await smtp.transporter.sendMail({
      from: smtp.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    logger.info({ email: opts.to, subject: opts.subject }, "Email sent successfully");
  } catch (err) {
    logger.error({ err, email: opts.to }, "Failed to send email — falling back to console log");
    logger.info(opts.fallbackLog);
  }
}
