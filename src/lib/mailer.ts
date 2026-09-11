import nodemailer from "nodemailer";

/**
 * Sends real mail as the actual contactachavite@gmail.com inbox via Gmail's
 * own SMTP (an "App Password", not the account password -- generated at
 * myaccount.google.com/apppasswords with 2-Step Verification on). Chosen
 * over a transactional provider (Resend) specifically so outgoing mail is
 * genuinely FROM this address, not a sandbox domain with a reply-to
 * workaround.
 */
type Transporter = ReturnType<typeof nodemailer.createTransport>;
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/** Never throws -- returns { error } so callers can degrade gracefully, same convention as the rest of the app's db/api helpers. */
export async function sendMail(input: SendMailInput): Promise<{ error: string | null }> {
  const t = getTransporter();
  if (!t) return { error: "not_configured" };
  try {
    await t.sendMail({
      from: `AchaVite <${process.env.GMAIL_USER}>`,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Échec de l'envoi." };
  }
}
