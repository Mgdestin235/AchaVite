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
        Le paiement se finalise via WhatsApp, en échange direct avec l&apos;équipe AchaVite. La
        commande est traitée dès confirmation du paiement par nos équipes.
      </p>
      <h2 className="mb-2 mt-5 font-bold text-navy">Livraison</h2>
      <p className="mb-3">
        Les délais et frais de livraison varient selon la ville et le mode choisi. Consultez notre
        page FAQ pour plus de détails.
      </p>

      <h2 className="mb-2 mt-6 font-bold text-navy">Abonnement vendeur</h2>
      <p className="mb-3">
        L&apos;ouverture d&apos;une boutique sur AchaVite est soumise à une période d&apos;essai
        payante, puis à un abonnement mensuel (« mode PRO ») dont le tarif, la durée et les
        fonctionnalités incluses sont fixés par AchaVite et peuvent être modifiés à tout moment ;
        le tarif en vigueur est toujours affiché avant toute activation ou renouvellement.
      </p>
      <p className="mb-3">
        Le paiement de l&apos;essai ou de l&apos;abonnement se finalise via les moyens de paiement
        indiqués dans l&apos;espace vendeur, avec confirmation par l&apos;équipe AchaVite.
        L&apos;accès complet à l&apos;espace vendeur est suspendu automatiquement à
        l&apos;expiration de l&apos;essai ou de l&apos;abonnement, jusqu&apos;à renouvellement.
      </p>
      <p className="mb-3">
        Un abonnement peut être suspendu ou annulé par AchaVite ou par le vendeur ; aucune période
        déjà payée n&apos;est perdue en cas de renouvellement anticipé.
      </p>
    </div>
  );
}
