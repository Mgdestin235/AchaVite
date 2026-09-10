import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "store-documents";
const MAX_BYTES = 5 * 1024 * 1024; // Vercel serverless body limit is ~4.5MB; keep a margin.
const TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Server-mediated upload of a justificatif into the private store-documents
 * bucket. Kept off Cloudinary on purpose (its PDF delivery block is an
 * account-level setting no code can override). Only the store's owner may
 * upload for it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const storeId = String(form.get("storeId") ?? "");
  if (!(file instanceof File) || !storeId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ext = TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format non accepté (PDF, JPG, PNG ou WEBP)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (5 Mo maximum)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("owner_id").eq("id", storeId).maybeSingle();
  if (!store || store.owner_id !== user.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const path = `${storeId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: "Échec du téléversement." }, { status: 502 });
  }

  return NextResponse.json({ path });
}
