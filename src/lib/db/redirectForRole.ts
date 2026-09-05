import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * After a successful login/MFA check, figures out where to send the user
 * based on their role in `profiles`. Returns the path to redirect to, or
 * an error message if the account has no place in the admin/vendor portals
 * (e.g. a customer account).
 */
export async function resolveRoleRedirect(
  supabase: SupabaseClient,
  userId: string
): Promise<{ path: string } | { error: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "Profil introuvable." };
  if (profile.role === "super_admin") return { path: "/super-admin" };
  if (profile.role === "vendor") return { path: "/admin" };
  return { error: "Ce compte n'a pas accès à l'espace vendeur ou administrateur." };
}
