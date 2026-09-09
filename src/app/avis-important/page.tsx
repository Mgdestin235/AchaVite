export const metadata = { title: "Avis important" };

export default function AvisImportantPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-sm leading-relaxed text-gray-600 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-navy">AVIS IMPORTANT — RÔLE DE LA PLATEFORME</h1>
      {/* TODO: validation juridique avant mise en production */}
      <div className="space-y-3">
        <p>
          « Cette plateforme est un service numérique de mise en relation entre acheteurs et
          vendeurs. Elle facilite la présentation des produits et services, la prospection de
          clients et la mise en relation des utilisateurs.
        </p>
        <p>
          La plateforme ne participe pas directement à la conclusion, à la négociation ou à
          l&apos;exécution des ventes conclues entre acheteurs et vendeurs et ne se substitue pas
          aux parties dans leur relation commerciale.
        </p>
        <p>
          Les vendeurs sont responsables des produits et services qu&apos;ils proposent, de
          l&apos;exactitude des informations publiées, de leurs prix, de leurs conditions de vente
          ainsi que du respect des obligations légales qui leur sont applicables.
        </p>
        <p>
          Les acheteurs sont responsables de leurs décisions d&apos;achat et des informations
          qu&apos;ils communiquent dans le cadre de leurs transactions.
        </p>
        <p>
          La plateforme met en œuvre des mesures destinées à protéger les données personnelles et
          les informations des utilisateurs conformément à sa politique de confidentialité et aux
          règles applicables.
        </p>
        <p>
          En utilisant la plateforme, chaque utilisateur reconnaît comprendre le rôle limité de la
          plateforme en tant qu&apos;intermédiaire numérique de mise en relation et accepte les
          conditions générales d&apos;utilisation. »
        </p>
      </div>
    </div>
  );
}
