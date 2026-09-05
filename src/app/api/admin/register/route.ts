import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

// Vendor self-registration: anyone can create a vendor account (they still
// need Super Admin approval before their store goes live -- see
// stores.status in the schema), so no invite code is required here.
export async function POST(request: Request): Promise<NextResponse> {
  const { name, email, password } = (await request.json()) as RegisterBody;

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
    user_metadata: { name: name?.trim() || undefined, role: "vendor" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user.id });
}
