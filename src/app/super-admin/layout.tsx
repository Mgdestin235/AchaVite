import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "./SuperAdminShell";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/connexion");
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/admin/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "vendor") {
    redirect("/admin");
  }
  if (profile?.role !== "super_admin") {
    redirect("/admin/connexion");
  }

  return <SuperAdminShell email={user.email ?? ""}>{children}</SuperAdminShell>;
}
