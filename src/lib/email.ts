/**
 * Single source of truth for AchaVite's email identity.
 *
 * CONTACT_EMAIL is a real Gmail inbox -- receiving mail there needs no app
 * code at all (any provider, including Resend below, can address a mail
 * TO a gmail.com address without restriction). SENDER is where automatic
 * app emails come FROM: Resend (like virtually every transactional email
 * provider) only allows sending "from" a domain you've verified with DNS
 * records, so it cannot send as an address on Google's own domain
 * (contactachavite@gmail.com) -- Gmail/DKIM would reject or spam-flag
 * that as spoofing. Every automatic email instead sets replyTo to
 * CONTACT_EMAIL, so hitting "Répondre" on any AchaVite email lands
 * directly in that inbox.
 */
export const CONTACT_EMAIL = "contactachavite@gmail.com";
export const EMAIL_SENDER = "AchaVite <onboarding@resend.dev>";
