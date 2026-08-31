export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-sm leading-relaxed text-gray-600 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-navy">Politique de confidentialité</h1>
      <p className="mb-3">
        AchaVite collecte uniquement les informations nécessaires au traitement de vos commandes :
        nom, téléphone, adresse et ville de livraison, ainsi que votre email lorsque votre
        commande contient un produit numérique (pour vous l&apos;envoyer).
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Utilisation des données</h2>
      <p className="mb-3">
        Vos données sont utilisées exclusivement pour traiter vos commandes, assurer la livraison
        et vous informer de leur statut. Elles ne sont jamais revendues à des tiers.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Paiement</h2>
      <p className="mb-3">
        AchaVite ne demande jamais d&apos;information bancaire. Le paiement se finalise directement
        avec nos équipes via WhatsApp, une messagerie chiffrée de bout en bout.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Vos droits</h2>
      <p className="mb-3">
        Vous pouvez demander la consultation, la modification ou la suppression de vos données en
        nous contactant directement.
      </p>
    </div>
  );
}
