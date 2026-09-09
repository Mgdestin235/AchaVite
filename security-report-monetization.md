# Rapport de sécurité — Système de monétisation (post-0003)

**Projet** : AchaVite — marketplace multi-vendeur (Next.js 16.3.2 + Supabase/Postgres)
**Périmètre** : tout ce qui a été ajouté/modifié depuis `0003_security_hardening.sql`
(migration `0004_monetization.sql`, `src/lib/payments/**`, `src/lib/db/*` monétisation,
`src/app/super-admin/monetisation/**`, `src/app/admin/(protected)/**` abonnement/paiement,
cron `subscription-reminders`, nouvelle page d'accueil et pages légales, `src/app/api/upload`)
**Date** : 2026-09-09
**Méthode** : revue de code statique des migrations SQL, des politiques RLS, des chemins d'écriture
client (PostgREST / anon key), audit des dépendances (`npm audit`). Aucun test contre la production.

---

## Synthèse

| Niveau | Nombre | Bloquant livraison |
|---|---|---|
| CRITICAL | 1 | oui |
| HIGH | 2 | oui |
| MEDIUM | 7 | non (à corriger avant la release suivante) |
| LOW | 8 | non |
| INFO | 2 | non |

**Gate production : BLOQUÉ** — 1 CRITICAL + 2 HIGH.

Points positifs constatés (à conserver) :

- Toutes les pages Super Admin `monetisation/*` sont des composants clients utilisant la clé **anon** :
  chaque écriture repasse par RLS. Il n'y a **aucun** chemin `service_role` exposé côté monétisation.
  Un vendeur ou un client authentifié qui appelle directement `confirm_subscription_payment`,
  `subscriptions.update`, `subscription_plans.update`, `payment_providers.update`,
  `platform_payment_methods.*`, `countries.update` ou `subscription_promotions.*` est **refusé par RLS**
  (vérifié policy par policy). La protection n'est pas seulement dans l'UI.
- `subscriptions`, `subscription_payments`, `invoices` sont correctement cloisonnées par
  `stores.owner_id` : **aucune fuite horizontale entre vendeurs** sur ces trois tables.
- Un vendeur **ne peut pas** s'auto-activer PRO : `subscriptions` n'a aucune policy INSERT/DELETE et
  son UPDATE est réservé `super_admin`.
- Un vendeur **ne peut pas** insérer un paiement `status='success'` : le trigger
  `recompute_subscription_payment()` force `status='pending'`, `amount`/`currency` du plan et remet
  `confirmed_by/confirmed_at` à NULL — et le `WITH CHECK` RLS est évalué *après* le trigger BEFORE,
  donc les deux se renforcent. Il n'existe aucune policy UPDATE/DELETE sur `subscription_payments`.
- `confirm_subscription_payment()` est bien verrouillée `super_admin` via `public.current_role()`
  (qui, depuis 0003, exclut aussi les comptes `suspended`), `set search_path = public`, et n'utilise
  **aucune concaténation SQL dynamique** : pas de surface d'injection.
- `store_payment_methods` : l'écriture est correctement isolée par vendeur (USING **et** WITH CHECK sur
  `owner_id`), donc pas d'IDOR en écriture malgré des helpers qui filtrent seulement `.eq("id", id)`.
- Facture `/admin/abonnement/factures/[id]` : double contrôle (RLS + vérification explicite
  `invoice.store_id !== store.id`) — pas d'IDOR.
- Aucun secret dans le dépôt, l'historique Git ou le bundle client (`.env*` ignoré, la clé
  `service_role` n'apparaît dans aucun chunk `.next/static`). `src/app/page.tsx`,
  `/avis-important`, `/conditions`, `/confidentialite` n'exposent aucune information sensible
  (les prix affichés viennent de `subscription_plans`, lecture publique assumée).
- La régression sur `handle_new_user()` (auto-attribution `super_admin`) corrigée en 0003 est
  **toujours en place** ; 0004 ne la réintroduit pas.

---

## CRITICAL

### C-01 — Next.js 16.3.2 : RCE non authentifiée (optimiseur d'images AVIF), aggravée par un `remotePattern` Cloudinary trop large

- **Fichiers** : `package.json` (`next: 16.3.2`), `next.config.ts` (`images.remotePatterns`),
  `node_modules/sharp@0.35.3`
- **Description** : `npm audit --omit=dev` remonte deux avis critiques sur la plage `next 16.0.0 – 16.3.2` :
  - GHSA-2xp9-vwfh-vxw4 — *Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used*
  - GHSA-p293-qw3h-jr36 — *Unauthenticated RCE on Windows-hosted servers* (non applicable à Vercel/Linux,
    mais applicable à tout `next dev`/`next start` lancé sur le poste Windows du projet)

  et un avis HIGH sur `sharp < 0.35.4` (vulnérabilités libheif GHSA-g89c-p67h-r497 / GHSA-2jg2-4ch7-h545),
  utilisé précisément par le pipeline d'optimisation d'images.

  L'exposition est directe : `next.config.ts` autorise `res.cloudinary.com` **sans restriction de
  `pathname`**, donc l'optimiseur accepte de télécharger et de décoder une image hébergée sur
  *n'importe quel* compte Cloudinary, y compris celui d'un attaquant.
- **Scénario d'exploitation** : un attaquant non authentifié crée un compte Cloudinary gratuit, y dépose
  un fichier AVIF malformé, puis appelle
  `https://achavite.vercel.app/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2F<son-cloud>%2Fimage%2Fupload%2Fpayload.avif&w=640&q=75`.
  Le décodage se fait côté serveur, dans le runtime qui détient `SUPABASE_SERVICE_ROLE_KEY`,
  `CLOUDINARY_API_SECRET`, `RESEND_API_KEY` et `CRON_SECRET` → compromission totale de la base
  (la clé service_role ignore toutes les RLS) et de tous les flux de paiement.
- **Preuve** (non destructive) :
  ```
  $ npm audit --omit=dev
  next  16.0.0 - 16.3.2   Severity: critical
  sharp <0.35.4           Severity: high
  ```
  `node -e "require('./node_modules/next/package.json').version"` → `16.3.2`, `sharp` → `0.35.3`.
- **Recommandation** :
  1. `npm install next@16.3.4 eslint-config-next@16.3.4` (le correctif est hors de la plage `16.3.2`
     figée, il faut donc modifier explicitement `package.json`), puis `npm install sharp@^0.35.4`
     (ou `npm audit fix`), commit du `package-lock.json`, redéploiement.
  2. Restreindre le pattern Cloudinary au seul cloud de la plateforme dans `next.config.ts` :
     ```ts
     { protocol: "https", hostname: "res.cloudinary.com", pathname: "/<votre-cloud-name>/**" }
     ```
     et supprimer `picsum.photos` (données de démo) du build de production.
  3. Ajouter une vérification de dépendances au CI (`npm audit --omit=dev --audit-level=high`).

---

## HIGH

### H-01 — Le paywall d'abonnement n'est appliqué que dans un layout Next.js : contournable en appelant PostgREST directement

- **Fichiers** : `src/app/admin/(protected)/(subscription-gated)/layout.tsx`,
  `supabase/migrations/0004_monetization.sql` (aucune policy ne référence `subscriptions`),
  `supabase/migrations/0001_marketplace_schema.sql` l. 388-401 (`products_write_owner_or_admin`),
  l. 456-465 (`order_items_*`), `0003` l. 193 (`orders_select_vendor_scoped`)
- **Description** : tout le blocage « essai expiré / PRO expiré / suspendu / annulé » repose sur
  `SubscriptionGatedLayout`, c'est-à-dire un **rendu côté serveur Next.js**. Aucune policy RLS, aucun
  trigger ni aucune fonction SQL n'associe l'état de `subscriptions` aux droits d'écriture sur
  `products`, `product_images`, `product_files`, `promos`, `delivery_zones` ou `order_items`.
  Or le portail vendeur travaille **directement contre PostgREST avec la clé anon** (voir
  `src/lib/supabase/client.ts` et tous les composants `Vendor*Client.tsx`) : le JWT du vendeur reste
  parfaitement valide et conserve tous ses droits, quel que soit son abonnement.
- **Scénario d'exploitation** : un vendeur dont l'abonnement est `trial_expired` (ou que le Super Admin
  vient de passer en `suspended` depuis `/super-admin/monetisation/abonnements`) est redirigé vers
  `/admin/abonnement`. Il ouvre la console du navigateur, récupère son `access_token`
  (`localStorage`/cookie Supabase) et exécute :
  ```js
  fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${TOKEN}`,
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ store_id: MON_STORE_ID, name: "...", price: 10000, status: "active" })
  })
  ```
  → produit créé/modifié, stock mis à jour, commandes lues et confirmées, exactement comme un
  abonné à jour. Ses produits restent d'ailleurs publiquement visibles et commandables
  (`products_select_public` ne dépend que de `stores.status='approved'`), donc **l'expiration
  d'abonnement n'a aucun effet réel sur son activité** : le modèle de revenus entier est contournable
  sans compétence particulière, et une suspension administrative est inopérante.
- **Recommandation** (à appliquer dans une migration `0005`) :
  1. Créer un helper évalué en base :
     ```sql
     create or replace function public.store_has_active_subscription(p_store_id uuid)
     returns boolean language sql stable security definer set search_path = public, pg_temp as $$
       select exists (
         select 1 from public.subscriptions s
         where s.store_id = p_store_id
           and (
             (s.status = 'trial_active' and s.trial_expires_at > now())
             or (s.status = 'pro_active' and s.current_period_end > now())
           )
       );
     $$;
     ```
     (le test sur la date rend la fonction correcte même si le cron n'a pas encore tourné, comme le
     fait déjà `computeSubscriptionStatus()` côté TypeScript).
  2. Ajouter cette condition au `WITH CHECK` (et au `USING` pour l'UPDATE) des policies d'écriture
     vendeur : `products_write_owner_or_admin`, `product_images_write`, `product_files_write`,
     `promos_write`, `delivery_zones_write`, `order_items_update_store_or_admin` —
     en gardant `or public.current_role() = 'super_admin'`.
  3. Faire dépendre `products_select_public` de la même fonction pour que les produits d'une boutique
     expirée disparaissent du catalogue public (décision produit à confirmer, mais c'est le
     comportement attendu d'un paywall).
  4. Conserver le layout Next.js : il devient une couche d'ergonomie, plus la seule barrière.

### H-02 — `subscription_payments` : le couple (`kind`, `plan_id`) est entièrement choisi par le client → PRO au tarif de l'essai et essai rejouable indéfiniment

- **Fichiers** : `supabase/migrations/0004_monetization.sql` l. 253-296 (trigger),
  l. 495-499 (`subscription_payments_insert_owner`), l. 325-386 (`confirm_subscription_payment`),
  `src/lib/db/subscriptionPayments.ts` (`createSubscriptionPaymentDeclaration`),
  `src/components/admin/AbonnementPaiementClient.tsx`
- **Description** : la policy d'INSERT ne contrôle que deux choses — `status = 'pending'` et la
  propriété de la boutique. Le trigger re-dérive `amount`, `currency_code` et la période **à partir du
  `plan_id` fourni par le client**, mais ne vérifie jamais :
  - que `kind` est cohérent avec le plan (`kind='trial'` ⇔ `plan.code='trial'`) ;
  - que le plan est `is_active` ;
  - que la boutique n'a pas **déjà** consommé son essai ;
  - que `kind <> 'refund'` (un « remboursement » déclaré par le vendeur passe dans la branche
    « sinon » de `confirm_subscription_payment()` et **active PRO**).

  Or `confirm_subscription_payment()` fait dépendre l'effet métier du seul champ `kind` :
  `kind='trial'` → `trial_active` pour `plan.duration_days`, tout le reste → `pro_active` pour
  `plan.duration_days`. Le prix payé et la durée accordée sont donc décorrélés.
- **Scénario d'exploitation** (2 variantes, aucune ne nécessite autre chose qu'un compte vendeur) :
  1. **PRO à prix d'essai** : le vendeur lit `subscription_plans` (lecture autorisée aux vendeurs),
     récupère l'`id` du plan `trial` (5 500 XOF / 90 jours), puis :
     ```js
     fetch(`${SUPABASE_URL}/rest/v1/subscription_payments`, { method:"POST", headers:{...},
       body: JSON.stringify({ store_id: MON_STORE, plan_id: ID_PLAN_TRIAL, kind: "pro_subscription" }) })
     ```
     Le trigger inscrit `amount = 5500`, `period_end = +90 jours`. Après validation manuelle,
     `subscriptions.status = 'pro_active'` et `current_period_end = now + 90 jours` :
     3 mois de PRO pour 5 500 FCFA au lieu de 45 000 FCFA.
  2. **Essai perpétuel (plus furtif)** : le vendeur redéclare simplement `kind='trial'` +
     `plan_id = trial` à chaque expiration. Rien en base n'interdit un second essai, et la console
     Super Admin (`/super-admin/monetisation/paiements`) affiche « Essai — 5 500 FCFA », ce qui est
     rigoureusement indiscernable d'un premier essai légitime : l'administrateur n'a aucune information
     lui indiquant que la boutique a déjà bénéficié de l'essai. Le vendeur reste ainsi éternellement à
     5 500 FCFA / 3 mois au lieu de 15 000 FCFA / mois.

  Effet secondaire comptable : `getRevenueSummary()` (`src/lib/db/subscriptionPayments.ts`) additionne
  les `refund` comme des montants positifs dans `today/last7Days/last30Days/thisYear`.
- **Recommandation** — dans `recompute_subscription_payment()`, re-dériver `kind` au lieu de le faire
  confiance, et bloquer le rejeu :
  ```sql
  -- refuser un plan inactif
  if not v_plan.is_active then raise exception 'Offre indisponible'; end if;

  -- kind dérivé du plan, jamais du client
  if v_plan.code = 'trial' then
    new.kind := 'trial';
    -- essai consommable une seule fois par boutique
    if v_sub.trial_activated_at is not null
       or exists (select 1 from public.subscription_payments p
                  where p.store_id = new.store_id and p.kind = 'trial'
                    and p.status in ('pending','success') and p.id <> new.id) then
      raise exception 'L''essai a déjà été utilisé pour cette boutique';
    end if;
  else
    new.kind := case when v_sub.pro_activated_at is null then 'pro_subscription' else 'renewal' end;
  end if;
  ```
  Interdire en plus `kind = 'refund'` à l'insertion client (`with check (kind <> 'refund')` dans la
  policy) et traiter le remboursement uniquement via une fonction `security definer` réservée
  `super_admin` qui n'accorde aucune période. Enfin, afficher dans la console Super Admin le nom du
  plan (`subscription_plans.code`) à côté de `kind`, pour que toute incohérence résiduelle soit visible.

---

## MEDIUM

### M-01 — La suppression de sa propre boutique efface en cascade abonnement, paiements et factures (RLS contournée par la cascade FK)

- **Fichiers** : `0004_monetization.sql` l. 186, 236, 308 (`on delete cascade` sur `store_id`),
  `0001_marketplace_schema.sql` l. 383 (`stores_delete_owner_or_admin`)
- **Description** : `invoices` et `subscription_payments` n'ont **volontairement** aucune policy
  DELETE — mais une suppression en cascade déclenchée par une contrainte FK est exécutée par le moteur
  avec les droits du propriétaire de table et **ignore la RLS**. Un vendeur ayant le droit de supprimer
  sa propre boutique efface donc ses paiements confirmés et ses factures.
- **Scénario** : un vendeur en litige (paiement contesté, remboursement réclamé, ou simplement désireux
  d'effacer la trace d'un essai déjà consommé — cf. H-02) exécute
  `DELETE /rest/v1/stores?id=eq.<son_store>` : abonnement, historique de paiements et factures
  disparaissent. Seul `audit_logs` conserve une trace partielle des validations
  (`confirm_subscription_payment`), et uniquement pour les paiements validés. Note : la suppression
  échoue si la boutique a des `order_items` (FK sans cascade), ce qui limite le cas aux boutiques sans
  commande — c'est-à-dire précisément le profil « essai consommé, aucune vente ».
- **Recommandation** : passer les FK `store_id` de `subscription_payments` et `invoices` en
  `on delete restrict` (ou `on delete set null` + colonne `store_name` dénormalisée conservée), et
  remplacer la suppression de boutique par un archivage (`stores.status = 'archived'`). Ajouter un
  trigger `before delete on stores` qui refuse la suppression s'il existe une facture.

### M-02 — `store_payment_methods` : tous les numéros mobile money des vendeurs sont lisibles anonymement en masse

- **Fichiers** : `0004_monetization.sql` l. 512-517
- **Description** : `using (is_active or <propriétaire> or super_admin)` — la première branche est vraie
  pour un visiteur **anonyme**. La clé anon étant publique (bundle client), n'importe qui peut faire
  `GET /rest/v1/store_payment_methods?select=*` et récupérer d'un coup le `label`, le `number` et les
  `instructions` de **toutes** les boutiques, y compris celles en statut `pending`, `rejected` ou
  `suspended` (la policy ne joint jamais `stores.status`, contrairement à `products_select_public`).
- **Scénario** : un attaquant exporte l'annuaire complet des numéros Orange Money / Wave / MTN des
  vendeurs, puis monte une campagne d'hameçonnage crédible (« AchaVite : régularisez votre abonnement
  sur ce numéro ») ou usurpe les numéros sur de fausses fiches produits. Aujourd'hui l'affichage prévu
  est unitaire (une fiche produit → les moyens de paiement de cette boutique) : l'exposition en masse
  n'est ni voulue ni nécessaire.
- **Recommandation** : restreindre la branche publique aux boutiques approuvées, et ne jamais renvoyer
  la liste globale :
  ```sql
  drop policy "store_payment_methods_select" on public.store_payment_methods;
  create policy "store_payment_methods_select" on public.store_payment_methods for select
    using (
      (is_active and exists (select 1 from public.stores s
                             where s.id = store_id and s.status = 'approved'))
      or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
      or public.current_role() = 'super_admin'
    );
  ```
  Idéalement, exposer ces données via une fonction `security definer` prenant un `store_id` obligatoire
  (ou une vue paginée), pour empêcher tout `select=*` global.

### M-03 — Aucune traçabilité sur les actions Super Admin les plus sensibles de la monétisation (et MFA facultative)

- **Fichiers** : `src/lib/db/subscriptions.ts` (`setSubscriptionStatus`),
  `src/lib/db/platformPaymentMethods.ts` (create/update/delete),
  `src/lib/db/subscriptionPlans.ts` (`updatePlan`), `src/lib/db/paymentProviders.ts`,
  `src/lib/db/subscriptionPromotions.ts`, `src/app/admin/connexion/page.tsx` (MFA « skippable »),
  `0004_monetization.sql` l. 413-421 (`audit_logs`)
- **Description** : `audit_logs` n'est alimenté que par `confirm_subscription_payment()` et par
  l'expiration automatique du cron. Toutes les autres opérations sensibles écrivent en direct dans les
  tables via PostgREST, sans aucune trace : suspension/annulation/réactivation d'un abonnement,
  modification du prix d'un plan, activation d'un prestataire, et surtout
  **création/modification/suppression d'un `platform_payment_methods`** — c'est-à-dire du numéro et du
  lien Wave sur lesquels tous les vendeurs envoient leur argent. Le second facteur d'authentification
  est par ailleurs proposé mais contournable (« Passer pour l'instant »), y compris pour le super admin.
- **Scénario** : un compte super admin compromis (ou un administrateur malveillant) remplace le
  `number`/`payment_link` de la méthode « Wave » par les siens. Tous les vendeurs qui déclarent un
  paiement voient le nouveau numéro et paient l'attaquant. Aucune ligne d'audit, aucune alerte, et la
  modification est indétectable a posteriori (pas d'historique de la valeur précédente).
- **Recommandation** :
  1. Ajouter un trigger d'audit générique sur `platform_payment_methods`, `subscription_plans`,
     `payment_providers`, `subscriptions` et `subscription_promotions` :
     ```sql
     create or replace function public.audit_row_change()
     returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
     begin
       insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
       values (auth.uid(), lower(tg_op), tg_table_name,
               case when tg_op = 'DELETE' then (to_jsonb(old)->>'id')::uuid
                    else (to_jsonb(new)->>'id')::uuid end,
               jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
       return coalesce(new, old);
     end $$;
     ```
     (attention : caster prudemment pour les tables à clé texte comme `payment_providers`/`countries`).
  2. Exposer ces journaux dans une page `/super-admin/monetisation/journal` (le helper
     `listAuditLogs()` existe déjà et n'est appelé nulle part).
  3. Rendre la MFA **obligatoire** pour `role = 'super_admin'` : si `listFactors()` est vide, forcer
     l'enrôlement dans `src/app/super-admin/layout.tsx` au lieu de permettre de passer l'étape.

### M-04 — Aucune limitation de débit sur les écritures monétisation ni sur `/api/admin/register`

- **Fichiers** : `0004_monetization.sql` l. 495-499, `src/app/api/admin/register/route.ts`,
  `src/lib/db/subscriptionPayments.ts` (`listAllSubscriptionPayments`, `getRevenueSummary`),
  `src/app/api/orders/lookup/route.ts`
- **Description** : aucun mécanisme de rate limiting n'existe dans le projet (aucune référence à
  un limiteur). Un vendeur authentifié peut insérer autant de lignes `subscription_payments` qu'il le
  souhaite ; or `/super-admin/monetisation/paiements` charge **toutes** les lignes sans pagination et
  `getRevenueSummary()` télécharge **toute** la table pour agréger côté navigateur.
  `/api/admin/register` crée des comptes avec `email_confirm: true` sans vérifier que le demandeur
  possède l'adresse, sans captcha ni quota. `/api/orders/lookup` permet un bruteforce code+téléphone.
- **Scénario** : `for (let i=0;i<50000;i++) fetch('.../subscription_payments', {method:'POST', ...})`
  → la console Super Admin devient inutilisable (des dizaines de Mo transférés au navigateur à chaque
  ouverture d'onglet), la validation des paiements légitimes est noyée, et le quota egress Supabase
  explose. Variante : création massive de comptes vendeurs « email confirmé » pour polluer la base
  et l'espace de modération.
- **Recommandation** :
  1. Contrainte d'unicité partielle empêchant plus d'une déclaration en attente par boutique :
     `create unique index on public.subscription_payments(store_id) where status = 'pending';`
  2. Paginer `listAllSubscriptionPayments` (`.range()`) et calculer les revenus par une vue agrégée
     SQL (`create view monetisation_revenue as select ... group by`) plutôt qu'en téléchargeant la table.
  3. Rate limiting applicatif sur `/api/admin/register`, `/api/orders/lookup`, `/api/upload`
     (Upstash Ratelimit ou table Postgres `rate_limits` + clé IP), et activer le captcha Supabase Auth
     ainsi que la confirmation d'e-mail réelle pour l'inscription vendeur.

### M-05 — `/api/upload` : la limite de taille signée est inopérante et le type de fichier n'est pas contraint

- **Fichier** : `src/app/api/upload/route.ts` (inchangé depuis l'audit précédent — re-vérifié)
- **Description** : la signature Cloudinary couvre `folder`, `max_bytes` et `timestamp`. `max_bytes`
  **n'est pas un paramètre d'upload Cloudinary** : il est signé mais n'impose rien (la limite de taille
  se configure via un *upload preset* signé ou `max_file_size` sur un preset). Par ailleurs
  `resource_type` fait partie des paramètres exclus de la signature : le client choisit librement
  `image`/`video`/`raw`, et aucun `allowed_formats` n'est imposé.
- **Scénario** : un vendeur authentifié (compte gratuit, création libre) demande une signature pour
  `products/pdf`, puis l'utilise pour téléverser en `resource_type=raw` un fichier arbitraire
  (HTML, SVG, exécutable) de plusieurs centaines de Mo sur le compte Cloudinary de la plateforme.
  Il obtient une URL `res.cloudinary.com/<cloud>/raw/upload/...` sous le domaine de confiance de la
  marque — utilisable pour héberger une page d'hameçonnage « AchaVite » ou un malware, et pour faire
  exploser la facture de stockage/bande passante.
- **Recommandation** : créer des *upload presets signés* côté Cloudinary (un par dossier) avec
  `allowed_formats`, `max_file_size` et `resource_type` fixés, ne signer que
  `{ upload_preset, folder, timestamp }`, et refuser côté client tout autre `resource_type`.
  Ajouter également un quota d'uploads par vendeur et par heure (cf. M-04).

### M-06 — En-têtes de sécurité toujours absents — aggravé par la validation de paiement en un clic

- **Fichiers** : `next.config.ts` (pas de `headers()`), `src/proxy.ts` (aucun en-tête ajouté),
  `vercel.json` (pas de section `headers`)
- **Description** : constat déjà remonté à l'audit précédent (référencé M-02 historique) et non corrigé :
  ni `Content-Security-Policy`, ni `X-Frame-Options`/`frame-ancestors`, ni
  `Strict-Transport-Security`, ni `Referrer-Policy`, ni `X-Content-Type-Options`,
  ni `Permissions-Policy`. **Le nouveau système de monétisation aggrave l'impact** : la console
  `/super-admin/monetisation/paiements` expose désormais un bouton « Valider » qui, en un seul clic,
  encaisse un paiement, active un abonnement et émet une facture — le tout sans confirmation.
- **Scénario (clickjacking)** : un attaquant envoie au super admin un lien vers une page qui charge
  `https://achavite.vercel.app/super-admin/monetisation/paiements` dans une `iframe` transparente
  positionnée sous un faux bouton. Le super admin, déjà authentifié, clique et valide sans le savoir un
  paiement frauduleux (celui inséré par l'attaquant vendeur via H-02). Aucune trace d'anomalie :
  l'action est parfaitement légitime du point de vue de l'application.
- **Recommandation** : ajouter dans `next.config.ts` :
  ```ts
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value:
        "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; " +
        "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com; " +
        "connect-src 'self' https://<projet>.supabase.co; " +
        "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ]}];
  }
  ```
  et ajouter une confirmation explicite (modale « Valider le paiement de X FCFA pour la boutique Y ? »)
  avant l'appel à `confirm_subscription_payment`.

### M-07 — Codes promo d'abonnement énumérables publiquement et jamais appliqués côté serveur

- **Fichiers** : `0004_monetization.sql` l. 166-178, l. 469-472 ;
  `src/lib/db/subscriptionPromotions.ts` ; `recompute_subscription_payment()` l. 275
- **Description** : deux problèmes symétriques.
  (a) `subscription_promotions_select using (active or super_admin)` rend toutes les promotions actives
  lisibles **anonymement** (`GET /rest/v1/subscription_promotions?select=*`) : codes, remises,
  `max_uses`, dates. Un code destiné à un partenaire ou à une campagne ciblée est donc public.
  (b) À l'inverse, le trigger fixe `new.amount := v_plan.price` sans jamais consulter les promotions,
  et rien n'incrémente `used` ni ne vérifie `max_uses`/`starts_at`/`ends_at` : la remise n'est
  appliquée nulle part. La table est donc à la fois exposée et non fonctionnelle — un piège si
  quelqu'un branche l'application de la remise côté client plus tard.
- **Scénario** : un visiteur anonyme récupère la liste des codes et les diffuse ; le jour où la remise
  sera implémentée, elle le sera sur une base déjà divulguée et sans compteur d'usage.
- **Recommandation** : restreindre la lecture (`using (public.current_role() = 'super_admin')`) et
  exposer la validation d'un code par une fonction `security definer`
  `validate_subscription_promo(p_code text, p_plan_id uuid)` qui vérifie dates/`max_uses`/plan et
  renvoie uniquement le montant remisé. Appliquer la remise **dans le trigger**
  (`new.amount := greatest(v_plan.price - v_discount, 0)`) et incrémenter `used` de façon atomique dans
  `confirm_subscription_payment()`. Tant que ce n'est pas fait, masquer l'onglet Promotions.

---

## LOW

### L-01 — `CRON_SECRET` comparé sans protection temporelle, et RPC exécutable par `anon`
`src/app/api/cron/subscription-reminders/route.ts` l. 25 : `authHeader !== \`Bearer ${secret}\`` est une
comparaison JavaScript non constante en temps. Le comportement est correct et **fail-closed** (secret
absent → 401, donc pas de spam d'e-mails ni de modification d'abonnement possible sans le secret :
les points 2 de la mission sont satisfaits sur le fond), mais l'idéal reste
`crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))` après vérification des
longueurs. Par ailleurs `0004` l. 388 accorde `execute` à `authenticated` sans révoquer le `PUBLIC`
implicite : un anonyme peut appeler `confirm_subscription_payment` (rejeté par le contrôle de rôle,
mais consommant une connexion). Ajouter :
`revoke execute on function public.confirm_subscription_payment(uuid) from public, anon;`

### L-02 — `confirm_subscription_payment()` : pas de verrou de ligne explicite
`0004` l. 342-349 : le `select ... where status='pending'` n'utilise pas `for update`, et l'`update`
ne re-teste pas `status = 'pending'`. Deux clics concurrents ne provoquent pas de double activation
(l'unicité `invoices.subscription_payment_id` fait échouer la seconde transaction, qui est annulée
intégralement), mais la protection est indirecte. Corriger en
`select * into v_payment from public.subscription_payments where id = p_payment_id and status = 'pending' for update;`
et `update ... where id = p_payment_id and status = 'pending';` avec vérification de `found`.

### L-03 — `search_path` sans `pg_temp` sur les fonctions `security definer` de 0004
`create_subscription_for_new_store`, `recompute_subscription_payment`, `confirm_subscription_payment`
utilisent `set search_path = public`. `pg_temp` restant implicitement consultable, la recommandation
standard (et le linter Supabase) est `set search_path = public, pg_temp`. Exploitation impraticable via
PostgREST (aucun moyen de créer un objet temporaire), d'où le niveau LOW — mais c'est une correction à
coût nul.

### L-04 — E-mail de rappel construit par concaténation HTML sans échappement
`src/app/api/cron/subscription-reminders/route.ts` l. 105-113 interpole `${subject}` et `${message}`
directement dans le HTML. Aujourd'hui ces valeurs proviennent exclusivement de constantes et d'un prix
formaté numériquement : **aucune injection possible**. Mais `/api/send-digital-delivery` définit déjà un
`escapeHtml()` : l'appliquer ici aussi évite qu'une future personnalisation (nom de boutique,
nom du vendeur) n'introduise une injection de contenu dans les e-mails sortants.

### L-05 — Un utilisateur peut s'écrire et modifier ses propres notifications
`0001` l. 485-486 (`notifications_insert_admin` autorise `user_id = auth.uid()`, `notifications_update_own`
sans `with check`). Avec les nouvelles colonnes `kind`/`metadata` de 0004, un vendeur peut se fabriquer
de fausses notifications « Abonnement PRO activé » ou altérer `metadata.subscription_id`. Aucune décision
d'autorisation ne dépend de cette table, d'où le niveau LOW ; à corriger en réservant l'INSERT au
`super_admin` (et au service_role du cron) et en ne laissant à l'utilisateur que la mise à jour de
`read_at`.

### L-06 — `platform_payment_methods` lisible anonymement
`0004` l. 459-460 : `using (is_active or super_admin)` → les coordonnées d'encaissement de la plateforme
(lien Wave, numéro Orange Money, bénéficiaire) sont exposées à tout visiteur non authentifié, alors que
seul un vendeur connecté en a besoin (`/admin/abonnement/paiement`). Restreindre à
`(is_active and auth.role() = 'authenticated') or public.current_role() = 'super_admin'`.

### L-07 — Chaîne de dépendances de développement vulnérable
`npm audit` : `vitest` (critical), `vite` (high), `js-yaml` (high), `esbuild`/`vite-node` (moderate),
tous en `devDependencies`. Non déployés, mais exploitables contre le poste d'un développeur exécutant
`npm test` sur une branche non fiable. Mettre à jour `vitest` vers une version ≥ 4.1.11.

### L-08 — Contrôles purement cosmétiques et données de configuration sur-exposées
(a) `src/app/super-admin/monetisation/prestataires/page.tsx` bloque l'activation d'un prestataire
`is_configured = false` uniquement dans l'UI ; un super admin peut contourner via PostgREST et activer
un prestataire dont `initiate()` lève `ProviderNotConfiguredError` (indisponibilité, pas de fuite).
Ajouter un `check (not is_active or is_configured)` sur `payment_providers`.
(b) `subscription_plans_select` autorise les vendeurs à lire les plans **inactifs** (tarifs
préparatoires, offres retirées) — restreindre au `super_admin` (`is_active or current_role()='super_admin'`).
(c) `store_payment_methods` et `platform_payment_methods` n'imposent aucune longueur maximale sur
`label`/`number`/`instructions` : ajouter des `check (length(...) <= n)`.

---

## INFO

### I-01 — La couche `src/lib/payments/` est saine
`registry.ts`, `providers/manual.ts` et `providers/stub.ts` n'exposent aucune information sensible :
les stubs se contentent de `Boolean(process.env[envVar])` (évalué côté serveur ; côté client
`process.env.WAVE_API_KEY` est simplement `undefined`, aucune valeur n'est inlinée dans le bundle car
les variables ne sont pas préfixées `NEXT_PUBLIC_`), et `initiate()` lève systématiquement
`ProviderNotConfiguredError` — donc **aucun appel réseau ni aucune clé n'est joignable tant que
`isConfigured()` est faux**. Le message d'erreur ne contient que la clé du prestataire, pas de détail
interne. Point d'attention pour la future intégration : le `redirectUrl` renvoyé par un vrai
prestataire devra être validé (schéma `https` uniquement) avant d'être passé à `window.open`, et le
montant devra être relu en base côté serveur, jamais repris du client.

### I-02 — Silence du cron en cas de secret manquant
Si `CRON_SECRET` n'est pas défini sur le projet Vercel, la route renvoie 401 à chaque exécution
planifiée : les expirations ne sont plus écrites en base et les rappels ne partent plus, sans aucune
alerte. L'accès reste correctement bloqué grâce à `computeSubscriptionStatus()` évalué à la volée
(bonne conception défensive), mais il faut une supervision : journaliser un `audit_logs` de fin de run
(`subscription_cron.completed`) et surveiller son absence.

---

## Liste priorisée des corrections avant livraison

| # | Finding | Action | Responsable | Bloquant |
|---|---|---|---|---|
| 1 | C-01 | `next@16.3.4` + `sharp@^0.35.4`, restreindre `remotePatterns` au cloud Cloudinary de la plateforme, supprimer `picsum.photos` | developer | **OUI** |
| 2 | H-01 | Migration `0005` : fonction `store_has_active_subscription()` + condition ajoutée aux policies d'écriture vendeur (`products`, `product_images`, `product_files`, `promos`, `delivery_zones`, `order_items`) | backend | **OUI** |
| 3 | H-02 | Migration `0005` : `kind` et validité du plan re-dérivés dans `recompute_subscription_payment()`, essai non rejouable, `refund` interdit à l'insertion client | backend | **OUI** |
| 4 | M-06 | En-têtes de sécurité (`CSP`, `frame-ancestors 'none'`, `HSTS`, `nosniff`, `Referrer-Policy`) + modale de confirmation avant `confirm_subscription_payment` | developer | non |
| 5 | M-02 / L-06 | Restreindre les policies SELECT de `store_payment_methods` (boutiques approuvées) et `platform_payment_methods` (authentifiés) | backend | non |
| 6 | M-01 | FK `restrict` sur `subscription_payments`/`invoices`, archivage de boutique au lieu de suppression | backend | non |
| 7 | M-03 | Triggers d'audit sur les tables de monétisation, page « Journal », MFA obligatoire pour le super admin | backend + developer | non |
| 8 | M-04 | Index unique partiel « un paiement en attente par boutique », pagination + vue d'agrégation des revenus, rate limiting sur `/api/admin/register`, `/api/orders/lookup`, `/api/upload` | backend + developer | non |
| 9 | M-05 | Upload presets Cloudinary signés (`allowed_formats`, `max_file_size`, `resource_type` figé) | developer | non |
| 10 | M-07 | Promotions : lecture réservée au super admin + application réelle de la remise dans le trigger, ou masquage de la fonctionnalité | backend | non |
| 11 | L-01 → L-08 | `timingSafeEqual` sur `CRON_SECRET`, `revoke ... from public, anon`, `for update` dans la RPC, `search_path = public, pg_temp`, `escapeHtml` dans le cron, durcissement des policies `notifications`, mise à jour de `vitest`, `check` sur `payment_providers` et longueurs de champs | backend + developer | non |

**Gate production : BLOQUED** tant que les lignes 1 à 3 ne sont pas corrigées et re-vérifiées.
