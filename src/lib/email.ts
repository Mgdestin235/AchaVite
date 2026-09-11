/**
 * Single source of truth for AchaVite's email identity. Outgoing mail is
 * sent via Gmail SMTP (see src/lib/mailer.ts) as this exact address, using
 * an App Password -- so "from", "reply-to" and the inbox that receives
 * replies are all genuinely the same real mailbox, no workaround needed.
 */
export const CONTACT_EMAIL = "contactachavite@gmail.com";
