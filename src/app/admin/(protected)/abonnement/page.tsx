import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { getSubscriptionByStore } from "@/lib/db/subscriptions";
import { listSubscriptionPaymentsForStore } from "@/lib/db/subscriptionPayments";
import { listInvoicesForStore } from "@/lib/db/invoices";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { computeSubscriptionStatus, daysUntil } from "@/lib/payments/pricing";
import { AbonnementStatusCard } from "@/components/admin/AbonnementStatusCard";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);
  if (!store) redirect("/admin/store");

  const [subscription, payments, invoices, trialPlan, proPlan] = await Promise.all([
    getSubscriptionByStore(supabase, store.id),
    listSubscriptionPaymentsForStore(supabase, store.id),
    listInvoicesForStore(supabase, store.id),
    getActivePlan(supabase, "trial"),
    getActivePlan(supabase, "pro_monthly"),
  ]);

  const effectiveStatus = computeSubscriptionStatus(subscription);
  const expiryIso = subscription?.status === "pro_active" ? subscription.current_period_end : subscription?.trial_expires_at;
  const daysRemaining = daysUntil(expiryIso ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-navy">Mon abonnement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Gérez votre essai gratuit, passez au PRO, et consultez vos paiements et factures.
      </p>

      <AbonnementStatusCard
        status={effectiveStatus}
        activatedAt={subscription?.status === "pro_active" ? subscription.pro_activated_at : subscription?.trial_activated_at}
        expiresAt={expiryIso ?? null}
        daysRemaining={daysRemaining}
        trialPlan={trialPlan}
        proPlan={proPlan}
      />

      <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Historique des paiements</h2>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Aucun paiement pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const invoice = invoices.find((i) => i.subscription_payment_id === p.id);
              const KIND_LABELS: Record<string, string> = {
                trial: "Essai",
                pro_subscription: "Abonnement PRO",
                renewal: "Renouvellement",
                refund: "Remboursement",
              };
              const STATUS_COLORS: Record<string, string> = {
                pending: "bg-yellow-100 text-yellow-700",
                success: "bg-green-100 text-green-700",
                failed: "bg-red-100 text-red-600",
                refunded: "bg-gray-100 text-gray-500",
              };
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-navy">{KIND_LABELS[p.kind] ?? p.kind}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-navy">
                      {Number(p.amount).toLocaleString("fr-FR")} {p.currency_code}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                    {invoice && (
                      <Link
                        href={`/admin/abonnement/factures/${invoice.id}`}
                        className="text-xs font-semibold text-orange underline"
                      >
                        Facture
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
