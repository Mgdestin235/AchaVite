import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorDeliveryClient } from "@/components/admin/VendorDeliveryClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function AdminDeliveryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de gérer vos zones de livraison." />;
  }

  return <VendorDeliveryClient storeId={store.id} />;
}
