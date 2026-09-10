import { redirect } from "next/navigation";

// Free vendor sign-up is no longer available: becoming a vendor now goes
// through the paid onboarding tunnel (offres -> paiement -> access code ->
// account creation). This route is kept only so old links don't 404.
export default function VendorRegisterRedirect() {
  redirect("/vendeur/offres");
}
