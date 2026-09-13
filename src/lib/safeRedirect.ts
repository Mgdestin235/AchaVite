/**
 * A `redirect` query param is attacker-controlled (it's part of the URL a
 * victim clicks). Only ever accept a same-origin relative path -- anything
 * absolute or protocol-relative (`//evil.com`, `https://evil.com`, `/\evil.com`)
 * falls back to the default instead of being followed.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/boutique"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
