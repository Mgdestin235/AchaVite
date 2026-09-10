import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "store-documents";

/**
 * Opens a store's justificatif document. New documents live in a private
 * Supabase Storage bucket (no Cloudinary PDF/ZIP delivery restriction to
 * fight); this returns a short-lived signed URL for them. Legacy documents
 * whose file_url is still a full http(s) URL are redirected as-is.
 *
 * Access: the owning vendor or a super admin only.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Document introuvable." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("store_documents")
    .select("file_url, stores(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

  const ownerId = (doc.stores as { owner_id?: string } | null)?.owner_id;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin" && ownerId !== user.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const value = doc.file_url as string;
  if (/^https?:\/\//i.test(value)) {
    return NextResponse.redirect(value, 302);
  }

  const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUrl(value, 300);
  if (error || !signed) {
    return NextResponse.json({ error: "Fichier indisponible." }, { status: 404 });
  }
  return NextResponse.redirect(signed.signedUrl, 302);
}
