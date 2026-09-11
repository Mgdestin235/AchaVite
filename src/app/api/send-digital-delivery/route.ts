import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_EMAIL, EMAIL_SENDER } from "@/lib/email";

type DeliveryFile = { name: string; url: string };

type RequestBody = {
  email: string;
  orderCode: string;
  customerName: string;
  files: DeliveryFile[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRUSTED_FILE_HOST = "res.cloudinary.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request): Promise<NextResponse> {
  // Only a signed-in vendor or super admin can trigger this -- it's called
  // right after a vendor/admin marks an order confirmed/delivered, never by
  // an anonymous visitor.
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Le service d'envoi d'email n'est pas configuré (RESEND_API_KEY manquant)." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as RequestBody;
  const { email, orderCode, customerName, files } = body;

  if (!email || !EMAIL_RE.test(email) || !files?.length || files.length > 20) {
    return NextResponse.json({ error: "Email ou fichiers invalides." }, { status: 400 });
  }
  for (const f of files) {
    let host = "";
    try {
      host = new URL(f.url).hostname;
    } catch {
      return NextResponse.json({ error: "Fichier invalide." }, { status: 400 });
    }
    if (host !== TRUSTED_FILE_HOST) {
      return NextResponse.json({ error: "Fichier invalide." }, { status: 400 });
    }
  }

  const resend = new Resend(apiKey);
  const safeCustomerName = escapeHtml(customerName || "");
  const safeOrderCode = escapeHtml(orderCode || "");
  const firstName = safeCustomerName.split(" ")[0] || safeCustomerName;

  const linksHtml = files
    .map((f) => `<li><a href="${f.url}" style="color:#FF7A1A;">${escapeHtml(f.name)}</a></li>`)
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: email,
      replyTo: CONTACT_EMAIL,
      subject: `Votre commande ${safeOrderCode} — téléchargement disponible`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0B1F3A;">Merci ${firstName} 🎉</h2>
          <p>Votre commande <strong>${safeOrderCode}</strong> est confirmée. Voici vos fichiers :</p>
          <ul>${linksHtml}</ul>
          <p style="color:#888; font-size:12px;">AchaVite — Les meilleures bonnes affaires à portée de main.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: "Échec de l'envoi de l'email." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Échec de l'envoi de l'email." }, { status: 500 });
  }
}
