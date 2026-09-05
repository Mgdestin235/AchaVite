import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorPromotionsClient } from "@/components/admin/VendorPromotionsClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de créer des codes promo." />;
  }

  return <VendorPromotionsClient storeId={store.id} />;
}
