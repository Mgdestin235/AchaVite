import Link from "next/link";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/db/types";
import { cn } from "@/lib/cn";

// Labels match the "Mode Free / Mode Pro" branding used on the homepage and
// in the Super Admin abonnements table -- kept identical in both places so
// a vendor never sees two different names for the same status.
const STATUS_META: Record<SubscriptionStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  trial_pending: { label: "Free non activé", color: "bg-navy/10 text-navy", icon: Clock },
  trial_active: { label: "Free actif", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  trial_expired: { label: "Free expiré", color: "bg-red-100 text-red-600", icon: XCircle },
  pro_active: { label: "PRO actif", color: "bg-orange-light text-orange-dark", icon: CheckCircle2 },
  pro_expired: { label: "PRO expiré", color: "bg-red-100 text-red-600", icon: XCircle },
  payment_pending: { label: "Paiement en attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  payment_failed: { label: "Paiement échoué", color: "bg-red-100 text-red-600", icon: ShieldAlert },
  suspended: { label: "Compte suspendu", color: "bg-gray-100 text-gray-600", icon: ShieldAlert },
  cancelled: { label: "Abonnement annulé", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function AbonnementStatusCard({
  status,
  activatedAt,
  expiresAt,
  daysRemaining,
  trialPlan,
  proPlan,
}: {
  status: SubscriptionStatus;
  activatedAt: string | null | undefined;
  expiresAt: string | null;
  daysRemaining: number | null;
  trialPlan: SubscriptionPlan | null;
  proPlan: SubscriptionPlan | null;
}) {
  const meta = STATUS_META[status];

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", meta.color)}>
          <meta.icon size={14} />
          {meta.label}
        </span>
        {daysRemaining !== null && daysRemaining >= 0 && (status === "trial_active" || status === "pro_active") && (
          <span className="text-sm font-semibold text-navy">{daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Date d&apos;activation</p>
          <p className="font-semibold text-navy">{formatDate(activatedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Date d&apos;expiration</p>
          <p className="font-semibold text-navy">{formatDate(expiresAt)}</p>
        </div>
      </div>

      {(status === "trial_pending") && trialPlan && (
        <div className="rounded-xl bg-navy/5 p-4">
          <p className="mb-2 text-sm text-navy">
            Activez votre essai de <strong>{trialPlan.duration_days} jours</strong> pour{" "}
            <strong>{Number(trialPlan.price).toLocaleString("fr-FR")} {trialPlan.currency_code}</strong> et commencez à vendre.
          </p>
          <Link
            href="/admin/abonnement/paiement?type=trial"
            className="block w-full rounded-xl bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
          >
            Activer l&apos;essai
          </Link>
        </div>
      )}

      {(status === "trial_expired" || status === "pro_expired" || status === "payment_failed") && proPlan && (
        <div className="rounded-xl bg-navy/5 p-4">
          <p className="mb-2 text-sm text-navy">
            Passez au <strong>PRO</strong> pour {Number(proPlan.price).toLocaleString("fr-FR")} {proPlan.currency_code} / mois et continuez à
            vendre sans interruption.
          </p>
          <Link
            href="/admin/abonnement/paiement?type=pro_subscription"
            className="block w-full rounded-xl bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
          >
            Passer au PRO
          </Link>
        </div>
      )}

      {status === "trial_active" && proPlan && (
        <div className="rounded-xl bg-navy/5 p-4">
          <p className="mb-2 text-sm text-navy">
            Passez dès maintenant au <strong>PRO</strong> ({Number(proPlan.price).toLocaleString("fr-FR")} {proPlan.currency_code} / mois) pour
            débloquer les fonctionnalités avancées.
          </p>
          <Link
            href="/admin/abonnement/paiement?type=pro_subscription"
            className="block w-full rounded-xl border-2 border-orange py-3 text-center text-sm font-bold text-orange hover:bg-orange-light"
          >
            Passer au PRO
          </Link>
        </div>
      )}

      {status === "pro_active" && proPlan && (
        <div className="rounded-xl bg-navy/5 p-4">
          <p className="mb-2 text-sm text-navy">
            Renouvelez dès maintenant pour prolonger votre abonnement PRO d&apos;un mois supplémentaire.
          </p>
          <Link
            href="/admin/abonnement/paiement?type=renewal"
            className="block w-full rounded-xl border-2 border-orange py-3 text-center text-sm font-bold text-orange hover:bg-orange-light"
          >
            Renouveler
          </Link>
        </div>
      )}

      {status === "payment_pending" && (
        <p className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
          Votre déclaration de paiement est en cours de vérification par notre équipe. Vous serez
          notifié dès que votre abonnement sera activé.
        </p>
      )}

      {(status === "suspended" || status === "cancelled") && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          Votre compte est {status === "suspended" ? "suspendu" : "annulé"}. Contactez l&apos;équipe AchaVite pour plus
          d&apos;informations.
        </p>
      )}
    </div>
  );
}
