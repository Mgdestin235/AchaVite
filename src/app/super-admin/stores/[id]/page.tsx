import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Mail, MapPin, Phone, Store as StoreIcon, User } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { listStoreDocuments } from "@/lib/db/storeDocuments";
import type { Store } from "@/lib/db/types";
import { StoreReviewActions } from "@/components/admin/StoreReviewActions";

const STATUS_LABEL: Record<Store["status"], string> = {
  pending: "En attente de validation",
  approved: "Approuvée",
  rejected: "Refusée",
  suspended: "Suspendue",
};

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="break-words text-sm font-medium text-navy">{value?.trim() ? value : "—"}</p>
      </div>
    </div>
  );
}

export default async function StoreDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase.from("stores").select("*").eq("id", id).maybeSingle<Store>();
  if (!store) notFound();

  const { data: owner } = await supabase
    .from("profiles")
    .select("name, phone, created_at")
    .eq("id", store.owner_id)
    .maybeSingle<{ name: string | null; phone: string | null; created_at: string }>();

  let ownerEmail = "";
  try {
    const { data } = await createAdminClient().auth.admin.getUserById(store.owner_id);
    ownerEmail = data?.user?.email ?? "";
  } catch {
    // best effort -- the dossier still renders without the email
  }

  const documents = await listStoreDocuments(supabase, store.id);

  return (
    <div className="max-w-3xl">
      <Link href="/super-admin/stores" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-navy">
        <ArrowLeft size={16} />
        Toutes les boutiques
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
          {store.logo_url ? (
            <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <StoreIcon size={22} />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">{store.name}</h1>
          <p className="text-sm text-gray-500">{STATUS_LABEL[store.status]}</p>
        </div>
      </div>

      {store.banner_url && (
        <div className="relative mb-5 h-36 w-full overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
          <Image src={store.banner_url} alt="Bannière" fill className="object-cover" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-3 text-xs font-semibold uppercase text-gray-400">Le vendeur</h2>
          <div className="space-y-3">
            <Field icon={<User size={15} />} label="Nom" value={owner?.name} />
            <Field icon={<Mail size={15} />} label="Email" value={ownerEmail} />
            <Field icon={<Phone size={15} />} label="Téléphone du compte" value={owner?.phone} />
            <Field
              icon={<User size={15} />}
              label="Inscrit le"
              value={owner?.created_at ? new Date(owner.created_at).toLocaleDateString("fr-FR") : null}
            />
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-3 text-xs font-semibold uppercase text-gray-400">La boutique</h2>
          <div className="space-y-3">
            <Field icon={<Phone size={15} />} label="Téléphone boutique" value={store.phone} />
            <Field icon={<Phone size={15} />} label="WhatsApp" value={store.whatsapp_number} />
            <Field icon={<MapPin size={15} />} label="Ville" value={store.city} />
            <Field icon={<MapPin size={15} />} label="Adresse" value={store.address} />
            <Field icon={<StoreIcon size={15} />} label="Horaires" value={store.opening_hours} />
          </div>
        </section>
      </div>

      {store.description && (
        <section className="mt-4 rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-2 text-xs font-semibold uppercase text-gray-400">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{store.description}</p>
        </section>
      )}

      <section className="mt-4 rounded-xl bg-white p-4 ring-1 ring-black/5">
        <h2 className="mb-3 text-xs font-semibold uppercase text-gray-400">
          Documents justificatifs ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <p className="rounded-lg bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800">
            Aucun document fourni par le vendeur. Vous pouvez lui demander de les ajouter depuis sa
            page « Ma boutique » avant validation.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/documents?id=${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-2.5 text-sm hover:bg-gray-50"
              >
                <FileText size={16} className="shrink-0 text-navy" />
                <span className="min-w-0 flex-1 truncate font-medium text-navy">{doc.label}</span>
                <span className="shrink-0 text-xs text-orange">Ouvrir</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {store.status === "rejected" && store.rejection_reason && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          Motif du refus communiqué au vendeur : {store.rejection_reason}
        </p>
      )}

      <div className="mt-6">
        <StoreReviewActions storeId={store.id} storeName={store.name} status={store.status} />
      </div>
    </div>
  );
}
