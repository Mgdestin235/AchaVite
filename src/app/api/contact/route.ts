import { Resend } from "resend";
import { NextResponse } from "next/server";
import { CONTACT_EMAIL, EMAIL_SENDER } from "@/lib/email";

type Body = { name?: string; email?: string; phone?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Public contact form -> delivers straight to CONTACT_EMAIL (contactachavite@gmail.com), reply-to the visitor. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as Body;
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !phone || !message) {
    return NextResponse.json({ error: "Merci de remplir tous les champs obligatoires." }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message trop long." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "L'envoi d'e-mails n'est pas encore configuré. Contactez-nous directement par WhatsApp." },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: CONTACT_EMAIL,
      replyTo: email || undefined,
      subject: `Nouveau message de contact — ${safeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0B1F3A;">Nouveau message depuis le formulaire de contact</h2>
          <p><strong>Nom :</strong> ${safeName}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>
          ${email ? `<p><strong>E-mail :</strong> ${escapeHtml(email)}</p>` : ""}
          <p><strong>Message :</strong></p>
          <p>${safeMessage}</p>
        </div>
      `,
    });
    if (error) {
      return NextResponse.json({ error: "Échec de l'envoi. Réessayez ou contactez-nous par WhatsApp." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez ou contactez-nous par WhatsApp." }, { status: 500 });
  }
}
