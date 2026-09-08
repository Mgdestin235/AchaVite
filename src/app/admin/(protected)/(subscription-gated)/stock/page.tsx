import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorStockClient } from "@/components/admin/VendorStockClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function AdminStockPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de pouvoir gérer un stock." />;
  }

  return <VendorStockClient storeId={store.id} />;
}
