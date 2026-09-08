import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorProductsClient } from "@/components/admin/VendorProductsClient";
import { NoStoreNotice } from "@/components/admin/NoStoreNotice";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return <NoStoreNotice message="Vous devez configurer votre boutique avant de pouvoir ajouter des produits." />;
  }

  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return <VendorProductsClient storeId={store.id} categories={categories ?? []} />;
}
