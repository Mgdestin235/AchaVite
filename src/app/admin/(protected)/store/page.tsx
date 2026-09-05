import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { StoreForm } from "@/components/admin/StoreForm";

export default async function VendorStorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [store, categoriesRes] = await Promise.all([
    getStoreByOwner(supabase, user!.id),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy">Ma boutique</h1>
      <p className="mb-5 text-sm text-gray-500">
        {store
          ? "Modifiez les informations de votre boutique."
          : "Créez votre boutique pour commencer à vendre sur AchaVite."}
      </p>
      <StoreForm store={store} categories={categoriesRes.data ?? []} />
    </div>
  );
}
