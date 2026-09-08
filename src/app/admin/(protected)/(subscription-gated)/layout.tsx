import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { getSubscriptionByStore } from "@/lib/db/subscriptions";
import { computeSubscriptionStatus, hasActiveAccess } from "@/lib/payments/pricing";

/**
 * Gates the vendor portal's core features (dashboard, produits, commandes,
 * stock, promotions, livraison) on an active trial/PRO subscription.
 * /admin/store, /admin/parametres and /admin/abonnement stay outside this
 * route group deliberately, so a gated vendor can still edit their store,
 * manage their account, and complete the trial/PRO payment flow.
 *
 * This is a nested layout (a sibling choke point to the auth/role check in
 * the parent (protected)/layout.tsx) rather than a pathname check there,
 * since Next.js layouts don't have direct access to the current path.
 *
 * The actual expiry enforcement lives in the daily reminder cron (which
 * flips subscriptions.status), but computeSubscriptionStatus() is also
 * evaluated live here so access is never wrong just because the cron
 * hasn't run yet today.
 */
export default async function SubscriptionGatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/connexion");

  const store = await getStoreByOwner(supabase, user.id);
  if (!store) {
    // No store yet -- the existing per-page "create your store first" UI
    // (see (protected)/page.tsx and others) handles this, not a redirect.
    return <>{children}</>;
  }

  const subscription = await getSubscriptionByStore(supabase, store.id);
  const effectiveStatus = computeSubscriptionStatus(subscription);
  if (!hasActiveAccess(effectiveStatus)) {
    redirect("/admin/abonnement");
  }

  return <>{children}</>;
}
