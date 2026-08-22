import { PaiementPageClient } from "./PaiementPageClient";

export default async function PaiementPage(props: PageProps<"/paiement">) {
  const searchParams = await props.searchParams;
  const orderId = typeof searchParams.commande === "string" ? searchParams.commande : "";
  return <PaiementPageClient orderId={orderId} />;
}
