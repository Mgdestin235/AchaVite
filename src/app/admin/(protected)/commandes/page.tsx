import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorOrdersClient } from "@/components/admin/VendorOrdersClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de pouvoir recevoir des commandes." />;
  }

  return <VendorOrdersClient storeId={store.id} />;
}
