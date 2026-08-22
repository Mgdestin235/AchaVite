import { ConfirmationPageClient } from "./ConfirmationPageClient";

export default async function ConfirmationPage(props: PageProps<"/confirmation">) {
  const searchParams = await props.searchParams;
  const orderId = typeof searchParams.commande === "string" ? searchParams.commande : "";
  return <ConfirmationPageClient orderId={orderId} />;
}
