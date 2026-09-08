"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Copy, Check, Landmark } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSubscriptionPaymentDeclaration } from "@/lib/db/subscriptionPayments";
import { getProvider } from "@/lib/payments/registry";
import type { PlatformPaymentMethod, SubscriptionPaymentKind, SubscriptionPlan } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const KIND_LABELS: Record<SubscriptionPaymentKind, string> = {
  trial: "Activation de l'essai",
  pro_subscription: "Abonnement PRO",
  renewal: "Renouvellement PRO",
  refund: "Remboursement",
};

export function AbonnementPaiementClient({
  storeId,
  storeName,
  kind,
  plan,
  methods,
  whatsappNumber,
}: {
  storeId: string;
  storeName: string;
  kind: SubscriptionPaymentKind;
  plan: SubscriptionPlan;
  methods: PlatformPaymentMethod[];
  whatsappNumber: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    const { payment, error } = await createSubscriptionPaymentDeclaration(supabase, storeId, plan.id, kind);
    setSubmitting(false);
    if (error || !payment) {
      toast.error(error || "Une erreur est survenue.");
      return;
    }

    const provider = getProvider("manual", whatsappNumber);
    const result = await provider.initiate({
      storeName,
      amount: Number(payment.amount),
      currencyCode: payment.currency_code,
      label: `${KIND_LABELS[kind]} — ${plan.name}`,
      reference: payment.id,
    });

    if (result.redirectUrl) {
      window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.warning("Numéro WhatsApp de confirmation non configuré. Contactez le support AchaVite.");
    }

    toast.success("Paiement déclaré. Il sera activé après validation par l'équipe AchaVite.");
    router.push("/admin/abonnement");
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-navy">{KIND_LABELS[kind]}</h1>
      <p className="mb-5 text-sm text-gray-500">
        {plan.name} — <strong>{Number(plan.price).toLocaleString("fr-FR")} {plan.currency_code}</strong> ({plan.duration_days} jours)
      </p>

      {methods.length === 0 ? (
        <div className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
          Aucun moyen de paiement n&apos;est configuré pour le moment. Contactez le support AchaVite.
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="rounded-xl border-2 border-gray-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
                  <Landmark size={16} />
                </span>
                <span className="text-sm font-bold text-navy">{m.label}</span>
              </div>
              {m.number && (
                <div className="mb-1.5 flex items-center justify-between rounded-lg bg-navy/5 px-3 py-2">
                  <span className="font-mono text-sm text-navy">{m.number}</span>
                  <button onClick={() => copy(m.number!)} className="text-gray-400 hover:text-navy">
                    {copied === m.number ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}
              {m.payment_link && (
                <a
                  href={m.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1.5 block truncate rounded-lg bg-navy/5 px-3 py-2 text-sm font-semibold text-orange underline"
                >
                  {m.payment_link}
                </a>
              )}
              {m.instructions && <p className="mt-1 text-xs text-gray-500">{m.instructions}</p>}
            </div>
          ))}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 hover:opacity-90 active:scale-95",
              submitting && "opacity-50"
            )}
          >
            <MessageCircle size={18} />
            {submitting ? "Envoi..." : "J'ai payé, confirmer sur WhatsApp"}
          </button>
        </div>
      )}
    </div>
  );
}
