import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorPaymentCenterClient } from "@/components/admin/VendorPaymentCenterClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function ParametresPaiementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de gérer vos moyens de paiement." />;
  }

  return <VendorPaymentCenterClient store={store} />;
}
