import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { VendorDashboard } from "@/components/admin/VendorDashboard";

const STATUS_NOTICE: Record<string, { title: string; body: string }> = {
  pending: {
    title: "Boutique en attente de validation",
    body: "Votre boutique a été créée et est en cours de vérification par l'équipe AchaVite. Vous pourrez ajouter des produits dès qu'elle sera approuvée.",
  },
  rejected: {
    title: "Boutique refusée",
    body: "Votre boutique n'a pas été approuvée. Modifiez les informations dans « Ma boutique » et soumettez-la à nouveau.",
  },
  suspended: {
    title: "Boutique suspendue",
    body: "Votre boutique a été suspendue par l'équipe AchaVite. Contactez le support pour plus d'informations.",
  },
};

export default async function VendorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/5 text-navy">
          <StoreIcon size={26} />
        </span>
        <h1 className="text-lg font-bold text-navy">Créez votre boutique</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Avant de pouvoir ajouter des produits et recevoir des commandes, configurez le profil
          de votre boutique.
        </p>
        <Link
          href="/admin/store"
          className="mt-2 rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Créer ma boutique
        </Link>
      </div>
    );
  }

  if (store.status !== "approved") {
    const notice = STATUS_NOTICE[store.status];
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
          <StoreIcon size={26} />
        </span>
        <h1 className="text-lg font-bold text-navy">{notice.title}</h1>
        <p className="max-w-sm text-sm text-gray-500">{notice.body}</p>
        {store.status === "rejected" && store.rejection_reason && (
          <p className="max-w-sm rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Motif : {store.rejection_reason}
          </p>
        )}
        <Link
          href="/admin/store"
          className="mt-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gray-50"
        >
          Voir ma boutique
        </Link>
      </div>
    );
  }

  return <VendorDashboard storeId={store.id} storeName={store.name} />;
}
