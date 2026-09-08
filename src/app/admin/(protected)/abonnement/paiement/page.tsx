import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { listPlatformPaymentMethods } from "@/lib/db/platformPaymentMethods";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import type { SubscriptionPaymentKind } from "@/lib/db/types";
import { AbonnementPaiementClient } from "@/components/admin/AbonnementPaiementClient";

const VALID_TYPES: SubscriptionPaymentKind[] = ["trial", "pro_subscription", "renewal"];

export default async function AbonnementPaiementPage(props: PageProps<"/admin/abonnement/paiement">) {
  const searchParams = await props.searchParams;
  const type = VALID_TYPES.includes(searchParams.type as SubscriptionPaymentKind)
    ? (searchParams.type as SubscriptionPaymentKind)
    : "trial";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);
  if (!store) redirect("/admin/store");

  const planCode = type === "trial" ? "trial" : "pro_monthly";
  const [plan, methods, { data: settings }] = await Promise.all([
    getActivePlan(supabase, planCode),
    listPlatformPaymentMethods(supabase, { activeOnly: true }),
    supabase.from("platform_settings").select("whatsapp_number").eq("id", 1).maybeSingle(),
  ]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-red-50 p-6 text-sm text-red-600">
        Cette offre n&apos;est pas disponible pour le moment. Contactez le support AchaVite.
      </div>
    );
  }

  return (
    <AbonnementPaiementClient
      storeId={store.id}
      storeName={store.name}
      kind={type}
      plan={plan}
      methods={methods}
      whatsappNumber={settings?.whatsapp_number ?? null}
    />
  );
}
