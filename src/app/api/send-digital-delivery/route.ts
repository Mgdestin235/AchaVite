import { Resend } from "resend";
import { NextResponse } from "next/server";

type DeliveryFile = { name: string; url: string };

type RequestBody = {
  email: string;
  orderCode: string;
  customerName: string;
  files: DeliveryFile[];
};

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Le service d'envoi d'email n'est pas configuré (RESEND_API_KEY manquant)." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as RequestBody;
  const { email, orderCode, customerName, files } = body;

  if (!email || !files?.length) {
    return NextResponse.json({ error: "Email ou fichiers manquants." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const firstName = customerName.split(" ")[0] || customerName;

  const linksHtml = files
    .map((f) => `<li><a href="${f.url}" style="color:#FF7A1A;">${f.name}</a></li>`)
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: "AchaVite <onboarding@resend.dev>",
      to: email,
      subject: `Votre commande ${orderCode} — téléchargement disponible`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0B1F3A;">Merci ${firstName} 🎉</h2>
          <p>Votre commande <strong>${orderCode}</strong> est confirmée. Voici vos fichiers :</p>
          <ul>${linksHtml}</ul>
          <p style="color:#888; font-size:12px;">AchaVite — Les meilleures bonnes affaires à portée de main.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
