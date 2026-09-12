import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase redirects back to after "Continuer avec Google" (PKCE
 * flow). Exchanges the one-time code for a real session, then sends the
 * buyer wherever they were headed. handle_new_user() (0001/0003) creates
 * their profile automatically on first sign-in, defaulting role to
 * 'customer' since Google's metadata never sets role: 'vendor'.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") || "/boutique";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
