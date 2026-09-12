"use client";

import { createClient } from "@/lib/supabase/client";

/** Google icon as inline SVG -- no icon font dependency, matches the brand's real 4-color G. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.03l2.98-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .97 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

/** "Continuer avec Google" -- Google provider must be enabled in Supabase Auth (Client ID/Secret from Google Cloud Console) before this works. */
export function GoogleSignInButton({ redirect }: { redirect?: string | null }) {
  const supabase = createClient();

  async function handleClick() {
    const params = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${params}`,
        // Without this, Google silently reuses whichever account is
        // already signed in on the device instead of letting the buyer
        // pick -- prompt=select_account forces the account chooser to
        // show every time.
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-navy hover:bg-gray-50"
    >
      <GoogleIcon />
      Continuer avec Google
    </button>
  );
}
