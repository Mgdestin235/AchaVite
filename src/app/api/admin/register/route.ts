import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  inviteCode?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const inviteSecret = process.env.ADMIN_INVITE_CODE;
  if (!inviteSecret) {
    return NextResponse.json(
      { error: "L'inscription administrateur n'est pas encore configurée." },
      { status: 503 }
    );
  }

  const { name, email, password, inviteCode } = (await request.json()) as RegisterBody;

  if (inviteCode !== inviteSecret) {
    return NextResponse.json({ error: "Code d'invitation invalide." }, { status: 403 });
  }
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email et mot de passe (8 caractères minimum) requis." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name?.trim() || undefined },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user.id });
}
