import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/db/stores";
import { InvoiceView } from "@/components/admin/InvoiceView";

export default async function InvoicePage(props: PageProps<"/admin/abonnement/factures/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await getStoreByOwner(supabase, user!.id);
  if (!store) redirect("/admin/store");

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice || invoice.store_id !== store.id) notFound();

  return <InvoiceView invoice={invoice} storeName={store.name} />;
}
