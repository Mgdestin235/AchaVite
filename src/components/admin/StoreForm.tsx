"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Store as StoreIcon, ImagePlus, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/uploadClient";
import { slugify } from "@/lib/format";
import { addStoreDocument, deleteStoreDocument, listStoreDocuments } from "@/lib/db/storeDocuments";
import type { Store, StoreDocument } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<Store["status"], { label: string; className: string }> = {
  pending: { label: "En attente de validation", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approuvée — visible sur AchaVite", className: "bg-green-100 text-green-700" },
  rejected: { label: "Refusée", className: "bg-red-100 text-red-600" },
  suspended: { label: "Suspendue", className: "bg-gray-100 text-gray-500" },
};

export function StoreForm({
  store,
  categories,
}: {
  store: Store | null;
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(store?.name ?? "");
  const [description, setDescription] = useState(store?.description ?? "");
  const [phone, setPhone] = useState(store?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number ?? "");
  const [address, setAddress] = useState(store?.address ?? "");
  const [city, setCity] = useState(store?.city ?? "");
  const [categoryId, setCategoryId] = useState(store?.category_id ?? categories[0]?.id ?? "");
  const [openingHours, setOpeningHours] = useState(store?.opening_hours ?? "");
  const [deliveryInfo, setDeliveryInfo] = useState(store?.delivery_info ?? "");
  const [logoUrl, setLogoUrl] = useState(store?.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(store?.banner_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImageUpload(file: File, kind: "logo" | "banner") {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingBanner;
    const setUrl = kind === "logo" ? setLogoUrl : setBannerUrl;
    setUploading(true);
    try {
      const url = await uploadFile(file, "image");
      setUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom de la boutique est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (store) {
        const wasRejected = store.status === "rejected";
        const { error } = await supabase
          .from("stores")
          .update({
            name: name.trim(),
            description,
            phone,
            whatsapp_number: whatsapp,
            address,
            city,
            category_id: categoryId || null,
            opening_hours: openingHours,
            delivery_info: deliveryInfo,
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            // Resubmitting after a refusal sends it back for a fresh review.
            ...(wasRejected ? { status: "pending", rejection_reason: null } : {}),
          })
          .eq("id", store.id);
        if (error) throw error;
        toast.success(wasRejected ? "Boutique resoumise pour validation" : "Boutique mise à jour");
      } else {
        const { error } = await supabase.from("stores").insert({
          owner_id: user.id,
          name: name.trim(),
          slug: `${slugify(name)}-${user.id.slice(0, 6)}`,
          description,
          phone,
          whatsapp_number: whatsapp,
          address,
          city,
          category_id: categoryId || null,
          opening_hours: openingHours,
          delivery_info: deliveryInfo,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          status: "pending",
        });
        if (error) throw error;
        toast.success("Boutique créée ! Elle est en attente de validation par l'équipe AchaVite.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {store && (
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-semibold",
              STATUS_LABELS[store.status].className
            )}
          >
            {STATUS_LABELS[store.status].label}
          </span>
          {store.status === "rejected" && store.rejection_reason && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Motif du refus : {store.rejection_reason}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase text-gray-400">Identité de la boutique</p>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Logo</label>
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                ) : (
                  <StoreIcon size={22} className="text-gray-300" />
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-navy hover:border-orange">
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                Choisir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Bannière</label>
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                {bannerUrl ? (
                  <Image src={bannerUrl} alt="Bannière" fill className="object-cover" />
                ) : (
                  <ImagePlus size={22} className="text-gray-300" />
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-navy hover:border-orange">
                {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                Choisir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "banner")}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la boutique"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de la boutique"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">Catégorie principale</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase text-gray-400">Contact & localisation</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Numéro WhatsApp"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Horaires (ex: Lun-Sam 8h-18h)"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
          />
          <textarea
            value={deliveryInfo}
            onChange={(e) => setDeliveryInfo(e.target.value)}
            placeholder="Informations de livraison"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
          />
        </div>
      </div>

      <StoreDocumentsSection store={store} />

      <button
        disabled={saving}
        className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : store ? "Mettre à jour la boutique" : "Créer ma boutique"}
      </button>
    </form>
  );
}

const DOC_TYPES = [
  "Pièce d'identité",
  "Registre de commerce",
  "Numéro fiscal / NIF",
  "Justificatif de domicile",
  "Autre document",
];

function StoreDocumentsSection({ store }: { store: Store | null }) {
  const supabase = createClient();
  const [docs, setDocs] = useState<StoreDocument[]>([]);
  const [label, setLabel] = useState(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    listStoreDocuments(supabase, store.id).then((d) => {
      if (!cancelled) setDocs(d);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, refreshKey]);

  async function handleUpload(file: File) {
    if (!store) return;
    setUploading(true);
    try {
      // Justificatifs go to a private Supabase Storage bucket via our own
      // route -- NOT Cloudinary, whose PDF delivery block is an account
      // setting no code can override.
      const fd = new FormData();
      fd.append("file", file);
      fd.append("storeId", store.id);
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) throw new Error(data.error || "Échec du téléversement");
      const { error } = await addStoreDocument(supabase, store.id, label, data.path);
      if (error) throw new Error(error);
      toast.success("Document ajouté");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: StoreDocument) {
    if (!confirm(`Supprimer « ${doc.label} » ?`)) return;
    const { error } = await deleteStoreDocument(supabase, doc.id);
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Documents justificatifs</p>
      <p className="mb-3 text-xs text-gray-500">
        Joignez les pièces demandées pour la validation de votre boutique par l&apos;équipe AchaVite
        (pièce d&apos;identité, registre de commerce...). PDF ou photo, 15 Mo maximum.
      </p>

      {!store ? (
        <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
          Créez d&apos;abord votre boutique : vous pourrez ensuite ajouter vos documents ici.
        </p>
      ) : (
        <>
          {docs.length > 0 && (
            <div className="mb-3 space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2.5 text-sm">
                  <FileText size={15} className="shrink-0 text-navy" />
                  <a
                    href={`/api/documents?id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate font-medium text-navy hover:underline"
                  >
                    {doc.label}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    aria-label="Supprimer le document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-navy hover:border-orange">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Envoi..." : "Ajouter un document"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
