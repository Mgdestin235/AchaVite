import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FOLDERS = ["products/images", "products/videos", "products/pdf", "products/ebooks"] as const;

// Issues a short-lived signature so the browser can upload a file directly
// to Cloudinary (bypassing this server entirely for the file bytes, which
// avoids Vercel's ~4.5MB serverless function body limit -- important for
// product videos and ebooks). Only a signed-in vendor/super admin may
// request one: this is the account that pays for Cloudinary usage.
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
  if (profile?.status !== "active" || !["vendor", "super_admin"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Le stockage de fichiers (Cloudinary) n'est pas encore configuré." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { folder?: string };
  const folder = ALLOWED_FOLDERS.find((f) => f === body.folder);
  if (!folder) {
    return NextResponse.json({ error: "Dossier de destination invalide." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const maxBytes = folder === "products/videos" ? 100 * 1024 * 1024 : 15 * 1024 * 1024;

  // Sign ONLY the params Cloudinary actually verifies. `max_bytes` is NOT a
  // real Cloudinary upload parameter -- it strips it before computing its
  // own string-to-sign, so signing it here produced a permanent "Invalid
  // Signature" mismatch. The size cap is enforced client-side instead (see
  // uploadClient.ts); `maxBytes` is still returned for that check.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, maxBytes });
}
