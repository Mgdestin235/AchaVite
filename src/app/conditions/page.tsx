export const metadata = { title: "Conditions générales" };

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-sm leading-relaxed text-gray-600 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-navy">Conditions générales de vente</h1>
      <p className="mb-3">
        En passant commande sur AchaVite, vous acceptez les présentes conditions générales de
        vente. AchaVite est l&apos;unique vendeur des produits proposés sur la plateforme.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Commandes</h2>
      <p className="mb-3">
        Toute commande passée sur AchaVite fait l&apos;objet d&apos;une confirmation par SMS ou
        notification. Les prix affichés sont en Francs CFA (FCFA), toutes taxes comprises.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Paiement</h2>
      <p className="mb-3">
        Le paiement s&apos;effectue via Mobile Money, carte bancaire ou tout autre moyen proposé
        au moment du paiement. La commande est traitée dès confirmation du paiement.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Livraison</h2>
      <p className="mb-3">
        Les délais et frais de livraison varient selon la ville et le mode choisi. Consultez notre
        page FAQ pour plus de détails.
      </p>
    </div>
  );
}
