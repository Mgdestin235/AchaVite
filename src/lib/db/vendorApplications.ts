import type { SupabaseClient } from "@supabase/supabase-js";
import type { VendorApplication, VendorApplicationStatus } from "./types";

export type VendorApplicationInput = {
  email: string;
  phone: string;
  planCode: string;
  amount: number;
  currencyCode: string;
  reference: string;
};

/** Public: a visitor declares they've paid the Free/Pro fee. Always inserted as 'pending'. */
export async function createVendorApplication(
  supabase: SupabaseClient,
  input: VendorApplicationInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("vendor_applications").insert({
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim() || null,
    plan_code: input.planCode,
    amount: input.amount,
    currency_code: input.currencyCode,
    reference: input.reference.trim() || null,
  });
  return { error: error?.message ?? null };
}

/** Super Admin. */
export async function listVendorApplications(
  supabase: SupabaseClient,
  filter?: { status?: VendorApplicationStatus }
): Promise<VendorApplication[]> {
  let query = supabase.from("vendor_applications").select("*").order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data } = await query;
  return (data as VendorApplication[]) ?? [];
}

function generateAccessCode(): string {
  // No ambiguous chars (0/O, 1/I/L). 10 chars -> ~40 bits, unguessable.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Super Admin confirms a payment -> generates the one-time access code. Returns it so it can be sent to the applicant. */
export async function confirmVendorApplication(
  supabase: SupabaseClient,
  id: string
): Promise<{ code: string | null; error: string | null }> {
  const code = generateAccessCode();
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("vendor_applications")
    .update({
      status: "confirmed",
      access_code: code,
      confirmed_by: userRes.user?.id ?? null,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

/** Super Admin rejects an application. */
export async function rejectVendorApplication(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("vendor_applications")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending");
  return { error: error?.message ?? null };
}
