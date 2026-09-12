/**
 * Buyers sign up/in with name + phone only, no email field in the UI --
 * but Supabase Auth's password-based accounts still need an email or a
 * verified phone as their identity. Real phone auth would require
 * enabling Supabase's Phone provider, which in turn needs a paid SMS
 * provider (Twilio/Vonage/...) configured just to be turned on, even
 * though we'd never actually send an OTP (the account is created
 * pre-confirmed via the Admin API). So instead: a deterministic,
 * never-delivered internal email derived purely from the phone number --
 * the exact same "confirm via Admin API, no email is ever sent" trick
 * already used for vendor accounts (see /api/vendeur/creer-compte).
 *
 * Both signup and login recompute this from whatever phone number the
 * buyer types, so it's fully transparent to them -- they never see or
 * type an email anywhere.
 */
/**
 * Google sign-in requires a Client ID/Secret from a registered Google
 * Cloud OAuth app (a Google requirement, not something any code or
 * service can bypass) plus enabling the Google provider in Supabase.
 * Until that's done, the button is hidden rather than shown broken
 * ("Unsupported provider") to real visitors -- flip to true once both
 * are configured (see chat for the setup steps). Phone + password
 * signup/login needs neither and already works standalone.
 */
export const GOOGLE_AUTH_ENABLED = false;

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function syntheticEmailForPhone(phone: string): string {
  const digits = normalizePhone(phone).replace(/\+/g, "");
  return `buyer+${digits}@achavite.internal`;
}

/**
 * Must be checked everywhere `user.email` might otherwise be shown to the
 * buyer or used to actually send something (checkout's digital-delivery
 * email, account page, etc.) -- a phone-signup account's `auth.users.email`
 * is this internal placeholder, never a real deliverable address, and
 * must be treated as "no email" wherever it surfaces.
 */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith("@achavite.internal");
}
