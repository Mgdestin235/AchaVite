# AchaVite — Rapport de bugs QA

- **Date** : 2026-09-07 · **Agent** : 06 — QA TESTER
- **Environnement** : local `C:\Users\HP\AchaVite` (Next 16.3.2, Node/Windows 11) + production `https://achavite.vercel.app` / Supabase `gwhfeudlshupsplhqbbm`
- **Statut global** : **FAIL**
- Aucune clé ni secret n'est reproduit dans ce document.

Légende sévérité : **Critique** (sécurité / perte financière / élévation de privilèges) · **Majeure** (fonction cassée, pas de contournement) · **Moyenne** (fonction dégradée ou contournable) · **Mineure** (confort, robustesse).

---

## BUG-01 — Élévation de privilèges : le rôle est choisi par le client au moment de l'inscription
- **Sévérité** : Critique · **Statut** : FAIL · **Zone** : Auth / RLS
- **Fichiers** : `supabase/migrations/0001_marketplace_schema.sql` (l. 53-75), `src/app/inscription/page.tsx` (l. 43-47)

Le trigger `handle_new_user()` recopie le rôle depuis les métadonnées fournies par le client :

```sql
coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
```

et la page d'inscription publique envoie effectivement ce champ depuis le navigateur :

```ts
options: { data: { name: ..., phone: ..., role: "customer" } }
```

`user_metadata` est entièrement contrôlé par l'appelant : rien n'empêche d'envoyer `role: "super_admin"`.

**Étapes de reproduction**
1. Récupérer la clé anon publique (elle est exposée dans le bundle JS de n'importe quelle page).
2. `POST https://<projet>.supabase.co/auth/v1/signup` avec `{"email":"x@y.z","password":"...","data":{"role":"super_admin"}}`.
3. Confirmer l'email, puis se connecter sur `/admin/connexion`.

**Attendu** : le compte est créé en `customer`; seul un super admin peut promouvoir un compte.
**Obtenu** : `profiles.role = 'super_admin'` → accès à `/super-admin/**` (validation des paiements, approbation des boutiques, taux de commission, lecture de toutes les commandes).
**Note** : non exécuté en production pour ne pas créer de compte parasite ; la chaîne trigger + policy est sans ambiguïté.
**Correctif suggéré** : forcer `'customer'` dans le trigger ; attribuer le rôle `vendor` uniquement côté serveur dans `/api/admin/register` (service role) après création.

---

## BUG-02 — Élévation de privilèges : un utilisateur authentifié peut modifier son propre rôle
- **Sévérité** : Critique · **Statut** : FAIL · **Zone** : RLS
- **Fichier** : `supabase/migrations/0001_marketplace_schema.sql` (l. 366)

```sql
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);
```

Sans clause `with check` restrictive, PostgreSQL réutilise l'expression `using` comme contrôle : la ligne reste la sienne, donc **toutes les colonnes sont modifiables, y compris `role` et `status`**.

**Étapes de reproduction**
1. Créer un compte client normal via `/inscription`, se connecter.
2. Depuis la console du navigateur : `supabase.from('profiles').update({ role: 'super_admin' }).eq('id', <mon id>)`.
3. Recharger `/super-admin`.

**Attendu** : erreur RLS (`role` non modifiable par le propriétaire).
**Obtenu** : mise à jour acceptée, accès super admin.
**Correctif suggéré** : restreindre la policy aux colonnes autorisées (trigger `BEFORE UPDATE` qui rejette tout changement de `role`/`status` si `current_role() <> 'super_admin'`).

---

## BUG-03 — Un vendeur peut auto-approuver sa boutique (contournement du gate super admin)
- **Sévérité** : Critique · **Statut** : FAIL · **Zone** : RLS / Portail super admin
- **Fichier** : `supabase/migrations/0001_marketplace_schema.sql` (l. 381-382)

```sql
create policy "stores_update_owner_or_admin" on public.stores for update
  using (owner_id = auth.uid() or public.current_role() = 'super_admin');
```

Même problème d'absence de `with check` ciblé : `status` fait partie des colonnes modifiables par le propriétaire.

**Étapes de reproduction**
1. Créer un compte vendeur via `/admin/inscription`, créer une boutique (`status = 'pending'`).
2. Console : `supabase.from('stores').update({ status: 'approved' }).eq('id', <ma boutique>)`.
3. Recharger `/admin` : le tableau de bord s'affiche, les produits deviennent publics.

**Attendu** : seul le super admin change `stores.status`.
**Obtenu** : approbation instantanée, la file d'attente de modération devient décorative.
**Correctif suggéré** : policy propriétaire limitée aux colonnes de présentation, `status` et `rejection_reason` réservés à `current_role() = 'super_admin'`.

---

## BUG-04 — Aucun contrôle serveur sur les montants : commandes, commissions et paiements falsifiables
- **Sévérité** : Critique · **Statut** : FAIL · **Zone** : Checkout / RLS / Finance
- **Fichiers** : `supabase/migrations/0001_marketplace_schema.sql` (l. 450-464), `src/lib/db/orders.ts`, `src/app/checkout/page.tsx`

```sql
create policy "orders_insert_anyone"      on public.orders      for insert with check (true);
create policy "order_items_insert_anyone" on public.order_items for insert with check (true);
create policy "orders_update_customer_or_admin" on public.orders for update
  using (customer_id = auth.uid() or public.current_role() = 'super_admin');
```

`createOrder()` s'exécute **dans le navigateur** : prix, `subtotal`, `discount`, `delivery_fee`, `total`, `commission_amount` et `vendor_payout` sont tous calculés côté client puis insérés tels quels. Rien ne les recalcule ni ne les valide côté serveur.

**Étapes de reproduction (a)** — commande à 1 FCFA
1. Ouvrir `/checkout` avec un panier réel, se connecter.
2. Console : rejouer l'insert avec `total: 1`, `subtotal: 1`.
3. La commande apparaît en super admin au montant falsifié.

**Étapes de reproduction (b)** — commission nulle
1. Insérer un `order_items` avec `commission_amount: 0`, `vendor_payout: subtotal`.
2. La plateforme ne perçoit rien sur la vente.

**Étapes de reproduction (c)** — auto-validation du paiement
1. En tant qu'acheteur connecté : `supabase.from('orders').update({ payment_status: 'reussi' }).eq('id', <ma commande>)`.
2. Le produit numérique devient éligible à l'envoi et la commande passe « Payée » côté vendeur.

**Attendu** : la création de commande et toute écriture de `payment_status` passent par une route serveur (service role) qui relit les prix en base.
**Obtenu** : écriture directe depuis le client, sans transaction (si l'insert des `order_items` échoue, la commande reste orpheline).

---

## BUG-05 — Fuite de données personnelles : tous les profils lisibles anonymement
- **Sévérité** : Critique · **Statut** : FAIL (**confirmé en production**) · **Zone** : RLS / Confidentialité
- **Fichier** : `supabase/migrations/0001_marketplace_schema.sql` (l. 365)

```sql
create policy "profiles_select_all" on public.profiles for select using (true);
```

**Étapes de reproduction**
1. `GET https://<projet>.supabase.co/rest/v1/profiles?select=id,name,phone,role` avec la seule clé anon publique (aucune session).
2. Réponse `206` avec `content-range: 0-4/9`.

**Attendu** : un visiteur anonyme ne lit aucun profil (le storefront affiche les infos vendeur depuis `stores`, jamais depuis `profiles` — vérifié : les seuls `select` sur `profiles` portent sur `id = auth.uid()` ou sont dans `/super-admin/users`).
**Obtenu** : nom, téléphone et **rôle** de tous les utilisateurs, y compris l'identification du compte `super_admin` (utile à un attaquant pour cibler BUG-01/02).
**Correctif suggéré** : `using (id = auth.uid() or public.current_role() = 'super_admin')`.

---

## BUG-06 — Portail vendeur : les commandes ne peuvent pas être affichées (policy RLS manquante sur `orders`)
- **Sévérité** : Majeure · **Statut** : FAIL · **Zone** : Portail vendeur / RLS
- **Fichiers** : `src/lib/db/orderItems.ts` (l. 30-33), `src/components/admin/VendorOrdersClient.tsx`, `src/components/admin/VendorDashboard.tsx` (l. 33-37)

Les deux écrans vendeur font une jointure sur `orders` :

```ts
"orders(code, customer_name, customer_phone, customer_email, delivery_mode, payment_status, created_at)"
```

Or la seule policy de lecture sur `orders` est :

```sql
create policy "orders_select_customer_or_admin" on public.orders for select
  using (customer_id = auth.uid() or public.current_role() = 'super_admin');
```

Un vendeur n'est ni le client ni super admin : la ressource embarquée est filtrée par RLS et revient `null`. Le commentaire du schéma l'assume explicitement (« a vendor's access is scoped through order_items instead »), mais le code applicatif suppose l'inverse.

**Étapes de reproduction**
1. Se connecter avec un compte vendeur ayant au moins une commande.
2. Ouvrir `/admin/commandes`.

**Attendu** : code commande, nom, téléphone et statut de paiement affichés ; la recherche fonctionne.
**Obtenu** : colonnes « Commande » et « Client » vides, badge de paiement retombant sur le défaut « Paiement en attente », recherche par code/téléphone inopérante. Sur `/admin`, **toutes** les statistiques (`CA`, `commandes du jour`, `en attente`, `expédiées`, `livrées`, graphique 14 jours) filtrent sur `it.orders` et affichent donc 0.
**Effet de bord** : dans `handleStatusChange`, `item.orders?.payment_status !== "reussi"` est toujours vrai ⇒ la livraison numérique côté vendeur ne se déclenche jamais (« paiement pas encore confirmé, envoi différé »).
**Correctif suggéré** : ajouter une policy `orders_select_vendor` (`exists (select 1 from order_items oi join stores s on s.id = oi.store_id where oi.order_id = orders.id and s.owner_id = auth.uid())`), ou dénormaliser les champs nécessaires dans `order_items`.

---

## BUG-07 — Le tableau de bord vendeur lit `orders.status`, qui n'est jamais écrit
- **Sévérité** : Majeure · **Statut** : FAIL · **Zone** : Portail vendeur
- **Fichiers** : `src/components/admin/VendorDashboard.tsx` (l. 51-59), `src/lib/db/orderItems.ts` (l. 47-54)

Le portail vendeur met à jour `order_items.status` (`updateOrderItemStatus`). Aucune ligne du dépôt n'écrit `orders.status` (`grep -rn "from(\"orders\")"` → seuls `payment_status`, `payment_method` et `digital_delivered` sont mis à jour). Or le dashboard compte `pending / shipped / delivered` sur `it.orders.status`.

**Attendu** : les compteurs suivent l'avancement saisi par le vendeur.
**Obtenu** : `orders.status` reste `'nouvelle'` pour l'éternité ⇒ « Expédiées » et « Livrées » restent à 0 même après correction de BUG-06 ; symétriquement `resolveOverallStatus()` (côté client, basé sur `order_items`) et `orders.status` (côté super admin et statistiques) divergent en permanence.
**Correctif suggéré** : utiliser `it.status` dans le dashboard, ou recalculer `orders.status` via un trigger SQL sur `order_items`.

---

## BUG-08 — Mode « Point relais » : impasse fonctionnelle au checkout
- **Sévérité** : Majeure · **Statut** : FAIL · **Zone** : Checkout / Portail vendeur
- **Fichiers** : `src/components/admin/VendorDeliveryClient.tsx`, `src/app/checkout/page.tsx` (l. 130-132, 177-180, 350-361)

`delivery_zones.relais_points` (text[]) n'est éditable **nulle part** dans le portail vendeur : l'écran Livraison ne propose que `fee_domicile`, `fee_relais`, `has_relais`, `has_boutique`. Le tableau reste donc `'{}'`.

Au checkout :
- `relaisAvailable = zonesForCity.every(z => z.has_relais)` → le bouton « Point relais » est **actif** ;
- le `<select>` n'est rendu que si `relaisPoints.length > 0` → **absent** ;
- la validation exige `relaisPoint` non vide → `toast.error("Merci de choisir un point relais.")`.

**Étapes de reproduction**
1. Vendeur : `/admin/livraison`, ajouter une ville et cocher « Point relais disponible ».
2. Client : ajouter un produit de ce vendeur, aller au checkout, choisir « Point relais », remplir le reste, valider.

**Attendu** : liste des points relais sélectionnable, ou mode désactivé.
**Obtenu** : aucun champ à remplir et soumission refusée en boucle — le client ne peut pas commander.
**Correctif suggéré** : éditeur de `relais_points` côté vendeur + `relaisAvailable = ... && z.relais_points.length > 0`.

---

## BUG-09 — La remise promo d'un vendeur est intégralement payée par la plateforme
- **Sévérité** : Majeure · **Statut** : FAIL · **Zone** : Finance
- **Fichier** : `src/lib/db/orders.ts` (l. 77-93)

```ts
const subtotal = it.price * it.quantity;               // prix plein
const commission_amount = Math.round((subtotal * commissionPercent) / 100);
vendor_payout: subtotal - commission_amount
```

`input.discount` n'est jamais répercuté sur les lignes. Le client paie `subtotal − discount`, alors que `Σ vendor_payout + Σ commission_amount = subtotal`.

**Cas mesuré (test isolé TC-ORD-02)** — 1 article à 100 000 FCFA, commission 10 % :

| Promo vendeur | Encaissé | Σ vendor_payout | Marge plateforme |
|---|---|---|---|
| 0 % | 100 000 | 90 000 | +10 000 |
| 10 % | 90 000 | 90 000 | **0** |
| 20 % | 80 000 | 90 000 | **−10 000** |

**Attendu** : la remise réduit le `subtotal` de la ligne du vendeur émetteur (et donc son payout) ; la commission se calcule sur le montant réellement encaissé.
**Obtenu** : la plateforme finance les promotions de ses vendeurs et peut se retrouver en perte sèche.

---

## BUG-10 — Aucune vérification de couverture de livraison : frais silencieusement à 0
- **Sévérité** : Majeure · **Statut** : FAIL · **Zone** : Checkout
- **Fichier** : `src/app/checkout/page.tsx` (l. 128-139)

```ts
const zone = zonesForCity.find((z) => z.store_id === storeId);
if (!zone) return sum;   // le vendeur sans zone est simplement ignoré
```

La liste des villes proposées est l'**union** des villes de tous les vendeurs du panier. Il suffit qu'un seul vendeur desserve N'Djamena pour que la ville apparaisse, y compris si un autre vendeur du panier ne livre que Moundou.

**Étapes de reproduction (TC-CHK-02)**
1. Panier : produit du vendeur A (zone N'Djamena, 2000) + produit du vendeur B (zone Moundou uniquement).
2. Checkout, choisir N'Djamena, mode domicile.

**Attendu** : refus, avertissement, ou frais du vendeur B explicite.
**Obtenu** : frais totaux 2000 FCFA ; le vendeur B doit livrer gratuitement dans une ville qu'il n'a pas configurée.

**Variante TC-CHK-03** : aucune zone configurée (**cas réel de la production aujourd'hui : 0 ligne dans `delivery_zones`**) → le champ « ville » devient libre, le récapitulatif affiche « Livraison : Gratuite » et la commande part.

---

## BUG-11 — Production non opérationnelle : aucun moyen de paiement et clé email absente
- **Sévérité** : Majeure · **Statut** : FAIL (**confirmé en production**) · **Zone** : Configuration / Paiement / Livraison numérique

**Constat 1** — `GET /rest/v1/platform_settings` (anon) renvoie :
`whatsapp_number: null`, `mtn_enabled: false`, `airtel_enabled: false`, `moov_enabled: false`, `bank_enabled: false`.
Conséquence dans `PaiementPageClient` : `enabledMethods.length === 0` ⇒ « Aucun moyen de paiement n'est encore configuré par AchaVite ». **Aucune commande ne peut être payée sur le site en ligne.** Même si un moyen était activé, `whatsapp_number` nul masque le bouton de confirmation.

**Constat 2** — `POST /api/send-digital-delivery` en production répond :
`503 {"error":"Le service d'envoi d'email n'est pas configuré (RESEND_API_KEY manquant)."}`
⇒ la validation de paiement en super admin affichera systématiquement un échec d'envoi pour les produits numériques.

**Constat 3** — la base ne contient **aucun produit publié** (0 ligne visible en anon) : catalogue, accueil et recherche sont vides en production.

**Attendu** : variables d'environnement Vercel complètes + `platform_settings` renseigné avant mise en ligne.
**Obtenu** : parcours d'achat impossible de bout en bout ; le test E2E réel est **BLOCKED**.

---

## BUG-12 — Trois routes API sensibles sans aucune authentification
- **Sévérité** : Majeure · **Statut** : FAIL (**BUG-12a confirmé en production**) · **Zone** : API / Sécurité

**12a — `POST /api/upload`** (`src/app/api/upload/route.ts`) : délivre une signature d'upload Cloudinary et l'`apiKey` à n'importe quel appelant, sans session ni vérification de rôle.
Reproduction : `curl -X POST -d '{"folder":"qa-probe"}' https://achavite.vercel.app/api/upload` → `200`, JSON contenant `signature` (40 caractères), `timestamp`, `apiKey`, `cloudName`. Impact : upload illimité de fichiers arbitraires sur le compte Cloudinary du projet (coût, hébergement de contenus illicites sous le domaine de la marque). Aucune restriction de `folder`, de type MIME ni de taille.

**12b — `POST /api/send-digital-delivery`** : aucun contrôle d'accès. Quiconque peut faire envoyer un email au nom d'AchaVite, vers n'importe quelle adresse, avec des liens arbitraires (`name` et `url` sont injectés **non échappés** dans le HTML — injection de balises possible). Actuellement masqué par le 503 de BUG-11, donc exploitable dès que la clé sera posée.

**12c — `POST /api/admin/register`** : crée via le service role un compte vendeur `email_confirm: true` sans captcha, sans rate limiting et sans vérification de l'adresse. Permet la création en masse de comptes vendeurs et le remplissage de la file de modération.

**Correctif suggéré** : vérifier la session (et le rôle) dans 12a et 12b ; ajouter un rate limit + une vraie confirmation d'email dans 12c.

---

## BUG-13 — Suivi invité : la normalisation du téléphone ignore l'indicatif pays
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Suivi de commande
- **Fichiers** : `src/lib/whatsapp.ts` (l. 58-60), `src/app/api/orders/lookup/route.ts` (l. 31)

`normalizePhoneForWhatsApp()` se contente de `replace(/[^0-9]/g, "")` : les espaces et les tirets sont bien gérés, mais `+235`, `00235` et `(235)` restent dans la chaîne comparée.

| Numéro à la commande | Numéro saisi au suivi | Attendu | Obtenu |
|---|---|---|---|
| `66 12 34 56` | `66123456` | match | match (PASS) |
| `66123456` | `+235 66 12 34 56` | match | **échec** |
| `66123456` | `00235 66123456` | match | **échec** |
| `(235) 66123456` | `66123456` | match | **échec** |

**Étapes de reproduction** : passer une commande en saisissant `66123456`, puis aller sur `/suivi` et saisir le même numéro au format international `+235 66 12 34 56` avec le bon code commande.
**Attendu** : commande trouvée.
**Obtenu** : « Aucune commande trouvée avec ce code et ce téléphone. » — le client est bloqué alors qu'il a fourni les bonnes informations.
**Correctif suggéré** : normaliser en forme canonique (retirer `+`/`00` + indicatif `235`, ne comparer que les 8 derniers chiffres) et appliquer la même normalisation à l'écriture dans `orders.customer_phone`.

---

## BUG-14 — Codes promo : plafond d'utilisation jamais appliqué, valeur jamais validée
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Promotions
- **Fichiers** : `src/lib/db/promos.ts`, `src/lib/db/orders.ts`, `src/components/admin/VendorPromotionsClient.tsx`

1. `promos.used` n'est **jamais incrémenté** : `createOrder()` ne touche pas la table. Le portail vendeur affiche « 0 / 100 » indéfiniment.
2. `max_uses` n'est **jamais vérifié** : `findActivePromoByCode()` ne filtre que sur `active`, `start_date`, `end_date`. Un code « 100 utilisations » est en réalité illimité.
3. Aucune validation de `value` à la création : un code `percent` de 150 % est accepté. TC-CHK-07 mesure un total de **−5 000 FCFA** pour un panier de 10 000.
4. Pas de montant minimum de commande ni de limite par client.

**Étapes de reproduction (2)** : créer un code à `max_uses = 1`, l'utiliser deux fois sur deux commandes → les deux remises s'appliquent.
**Correctif suggéré** : contrôle serveur au moment de la création de commande (incrément atomique de `used` + refus si `used >= max_uses`), et `check (type <> 'percent' or value between 0 and 100)` en SQL.

---

## BUG-15 — Injection de jokers `ilike` dans les codes promo et les codes commande
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Promotions / Suivi
- **Fichiers** : `src/lib/db/promos.ts` (l. 21), `src/app/api/orders/lookup/route.ts` (l. 27)

La saisie utilisateur est passée telle quelle à `.ilike()` : `%` et `_` conservent leur sens de joker.

**Étapes de reproduction** : dans le champ « Code promo » du panier, saisir `%` et cliquer sur « Appliquer ».
**Attendu** : « Code promo invalide ou expiré ».
**Obtenu** : la requête `ilike('code','%')` correspond à **tous** les codes actifs ; s'il n'en existe qu'un seul en base, il est appliqué sans que le client l'ait jamais connu (le contrôle suivant ne vérifie que l'appartenance au panier). Avec plusieurs codes, `maybeSingle()` lève une erreur silencieusement avalée (aucun `error` n'est lu) ⇒ « code invalide » alors qu'il est valide.
Même schéma côté suivi : `{"code":"%","phone":"..."}` est bien exécuté par la route (vérifié en production, retour 404 uniquement parce que la base contient au plus une commande).
**Correctif suggéré** : échapper `%`/`_`/`\` ou utiliser `.eq()` sur une colonne normalisée en majuscules.

---

## BUG-16 — Aucune validation de stock au checkout (survente silencieuse)
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Checkout / Stock
- **Fichiers** : `src/app/checkout/page.tsx`, `src/lib/db/products.ts` (`listPublicProductsByIds`), `supabase/migrations/0001` (l. 183-195)

`listPublicProductsByIds()` ne filtre ni sur `status` ni sur `stock`. Le checkout ne compare jamais `line.qty` à `product.stock`. Côté SQL, `decrement_product_stock` fait `greatest(stock - p_quantity, 0)` : la survente n'échoue pas, elle est **absorbée**, et `sold_count` est incrémenté de la quantité demandée même si le stock ne le permettait pas.

**Étapes de reproduction**
1. Ajouter un produit au panier (stock 1).
2. Faire tomber le stock à 0 depuis le portail vendeur (ou laisser un autre client acheter).
3. Revenir sur le panier conservé en `localStorage` et valider la commande.

**Attendu** : ligne signalée en rupture et commande refusée.
**Obtenu** : commande créée, stock déjà à 0, `sold_count` faussé, le vendeur doit annuler manuellement.

---

## BUG-17 — Code de commande sur 6 caractères : collisions probables, aucun retry
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Création de commande
- **Fichiers** : `src/lib/format.ts` (l. 10-12), `src/lib/db/orders.ts` (l. 45-46), `0001` (`code text not null unique`)

`orderCode(id) = "AV-" + id.slice(-6).toUpperCase()` → 16^6 ≈ 16,7 millions de valeurs. Sur une colonne `unique`, la probabilité d'au moins une collision atteint ~50 % vers 4 800 commandes et ~75 % vers 7 500.

**Attendu** : en cas de collision, régénérer le code.
**Obtenu** : l'`insert` échoue et `createOrder` renvoie l'erreur Postgres brute (« duplicate key value violates unique constraint ») directement dans un toast client ; la commande est perdue, le panier est conservé mais l'utilisateur n'a aucune action utile.
**Correctif suggéré** : code plus long ou séquence dédiée, plus une boucle de retry sur violation d'unicité.

---

## BUG-18 — La suspension d'un utilisateur n'a aucun effet
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Portail super admin / Auth
- **Fichiers** : `src/app/super-admin/users/page.tsx` (l. 49-58), `src/app/admin/(protected)/layout.tsx`, `src/app/super-admin/layout.tsx`

`toggleStatus()` écrit `profiles.status = 'suspended'`, mais aucune vérification de `status` n'existe dans le code (`grep` : seules les colonnes `stores.status` et `products.status` sont testées ; `profiles.status` n'est lu que pour l'affichage du badge dans cette même page). Les layouts protégés ne sélectionnent que `role`.

**Étapes de reproduction** : suspendre un vendeur, puis se connecter avec son compte.
**Attendu** : connexion refusée ou portail inaccessible.
**Obtenu** : accès complet au portail vendeur, gestion des produits et des commandes inchangée. Idem pour un client suspendu qui continue de commander.

---

## BUG-19 — Écran Stock : une écriture en base par frappe clavier, remise à zéro accidentelle
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Portail vendeur
- **Fichier** : `src/components/admin/VendorStockClient.tsx` (l. 90-94)

```tsx
<input value={p.stock} onChange={(e) => setStock(p.id, Number(e.target.value) || 0)} />
```

**Étapes de reproduction**
1. `/admin/stock`, sélectionner le contenu du champ d'un produit et taper `150`.
2. Observer les requêtes réseau.

**Attendu** : une seule écriture, au `blur` ou après debounce.
**Obtenu** : `stock = 0` (champ vidé), puis 1, puis 15, puis 150 — quatre `UPDATE` successifs. Si l'utilisateur quitte la page entre-temps ou perd le réseau, **le stock reste à 0**. Les requêtes n'étant pas ordonnancées, une réponse tardive peut en outre écraser la valeur finale.

---

## BUG-20 — Statistiques super admin : CA et commissions faux
- **Sévérité** : Moyenne · **Statut** : FAIL · **Zone** : Portail super admin
- **Fichiers** : `src/app/super-admin/page.tsx` (l. 27-31), `src/app/super-admin/commissions/page.tsx` (l. 23-25, 48)

```ts
const revenue = orders.filter((o) => o.status !== "annulee").reduce((s, o) => s + Number(o.total), 0);
const commissionEarned = (revenue * commissionPercent) / 100;
```

1. Le filtre porte sur `orders.status`, qui n'est jamais écrit (BUG-07) ⇒ aucune commande n'est jamais exclue.
2. `payment_status` n'est pas pris en compte : les commandes en attente et les paiements **refusés** sont comptés dans le chiffre d'affaires.
3. La commission est recalculée sur `orders.total`, qui **inclut les frais de livraison** et **déduit la remise**, alors que `order_items.commission_amount` est calculé sur le sous-total brut : les deux chiffres ne coïncident jamais.

**Attendu** : CA = somme des commandes `payment_status = 'reussi'` ; commissions = `sum(order_items.commission_amount)`.
**Obtenu** : chiffres surévalués et incohérents entre les deux écrans.

---

## BUG-21 — La 2FA obligatoire est contournable par un bouton
- **Sévérité** : Moyenne (assumée temporairement) · **Statut** : FAIL · **Zone** : Auth
- **Fichiers** : `src/components/admin/MfaEnroll.tsx` (l. 103-105, 135-141), layouts protégés

Le bouton « Continuer sans 2FA pour l'instant » appelle `onDone()` → `redirectAfterAuth()`. Comme les layouts n'exigent `aal2` que si `nextLevel === 'aal2'` (donc uniquement si un facteur est **déjà** enrôlé), un compte qui saute l'enrôlement accède indéfiniment au portail avec un simple mot de passe.

**Étapes de reproduction** : créer un compte vendeur, se connecter, cliquer sur « Continuer sans 2FA pour l'instant », puis se reconnecter plus tard — l'étape 2FA ne revient jamais comme bloquante.
**Attendu (spec)** : 2FA TOTP obligatoire pour `/admin/**` et `/super-admin/**`.
**Obtenu** : contournement permanent en un clic. À retirer avant la mise en service ; à combiner avec un contrôle serveur de `aal2` dans les layouts.

---

## BUG-22 — Routes API : corps JSON malformé ⇒ 500, fuite d'erreurs Postgres
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : API
- **Fichiers** : `src/app/api/orders/lookup/route.ts`, `set-payment-method/route.ts`, `send-digital-delivery/route.ts`, `admin/register/route.ts`, `upload/route.ts`

Aucune de ces routes n'entoure `await request.json()` d'un `try/catch`.

Reproduction 1 : `curl -X POST -d 'not-json' .../api/orders/lookup` → **500** (attendu : 400).
Reproduction 2 : `curl -X POST -d '{"orderId":"not-a-uuid","method":"mtn"}' .../api/orders/set-payment-method` → **500** `{"error":"invalid input syntax for type uuid: \"not-a-uuid\""}` — message d'erreur interne renvoyé au client (attendu : 400 générique).

---

## BUG-23 — Formulaire produit : échec silencieux
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Portail vendeur
- **Fichier** : `src/components/admin/ProductFormModal.tsx` (l. 82-83)

```ts
if (!values.name.trim() || !values.price) return;
if (values.images.length === 0) return;
```

**Étapes de reproduction** : ouvrir le formulaire produit, laisser le prix vide (ou n'ajouter aucune image), cliquer sur Enregistrer.
**Attendu** : message indiquant le champ manquant.
**Obtenu** : rien ne se passe, la modale reste ouverte sans explication. À noter aussi : `!values.price` étant faux pour `0`, un produit gratuit est impossible à créer.

---

## BUG-24 — Génération de slug basée sur une lecture filtrée par RLS
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Boutiques / Produits
- **Fichiers** : `src/lib/db/stores.ts` (l. 35-45), `src/lib/db/products.ts` (l. 101-111)

`uniqueStoreSlug()` teste l'unicité avec un `select` soumis à `stores_select_public` (qui masque les boutiques `pending`/`rejected` d'autrui). Un slug déjà pris par une boutique non approuvée est donc invisible.
**Attendu** : suffixe `-2`.
**Obtenu** : le slug est jugé libre, l'`insert` viole `stores_slug_key` et l'erreur Postgres brute remonte à l'utilisateur. Même schéma pour `products` avec un produit `inactive` d'un autre vendeur.

---

## BUG-25 — Boutique suspendue : deux boutons redondants, refus non modifiable
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Portail super admin
- **Fichier** : `src/app/super-admin/stores/page.tsx` (l. 126-157)

`status !== 'approved'` affiche « Approuver » **et** `status === 'suspended'` affiche « Réactiver » : deux boutons identiques en action pour une boutique suspendue. Par ailleurs « Refuser » n'est proposé que pour `pending` : impossible de refuser (ou de corriger le motif) une boutique déjà approuvée ou déjà refusée.

---

## BUG-26 — Route `/api/orders/by-phone` documentée mais inexistante
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Documentation / Cohérence
- **Fichiers** : `supabase/migrations/0001` (l. 444-447), `0002` (l. 11), `src/lib/lastOrder.ts` (l. 5-9)

Trois commentaires décrivent `/api/orders/by-phone` comme le second point d'entrée du suivi invité. La route n'existe ni dans `src/app/api/orders/` ni dans la sortie du build (44 routes listées). Aucun code ne l'appelle : c'est de la dérive documentaire, mais elle laisse croire qu'un utilisateur peut retrouver ses commandes avec son seul numéro.

---

## BUG-27 — `ProductCard` plante si un produit n'a pas d'image
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Storefront
- **Fichier** : `src/components/product/ProductCard.tsx` (l. 36)

`<Image src={product.images[0]} ...>` sans garde. `toLegacyProduct()` mappe `product_images` qui peut être vide (la contrainte n'existe que côté formulaire client, pas en base : `product_images` n'a aucune contrainte de cardinalité minimale, et un `insert` direct ou un échec partiel de `createProduct` produit ce cas).
**Attendu** : image de remplacement.
**Obtenu** : `next/image` lève « src is required » et fait tomber toute la grille de produits.

---

## BUG-28 — `getStoreByOwner` casse tout le portail si un vendeur a deux boutiques
- **Sévérité** : Mineure · **Statut** : FAIL · **Zone** : Portail vendeur
- **Fichier** : `src/lib/db/stores.ts` (l. 9-14)

`.maybeSingle()` renvoie une erreur `PGRST116` dès qu'il existe deux lignes. Or rien n'empêche un vendeur d'insérer une seconde boutique (`stores_insert_vendor with check (owner_id = auth.uid())`, aucun index unique sur `owner_id`). L'erreur n'étant pas lue, `getStoreByOwner` renvoie `null` et **toutes** les pages du portail affichent « Créez votre boutique », rendant les produits et commandes existants inaccessibles.
**Correctif suggéré** : `unique (owner_id)` sur `stores`, ou `.order('created_at').limit(1)`.

---

## Récapitulatif

| ID | Sévérité | Zone | Statut |
|---|---|---|---|
| BUG-01 | Critique | Auth / RLS | FAIL |
| BUG-02 | Critique | RLS | FAIL |
| BUG-03 | Critique | RLS / Super admin | FAIL |
| BUG-04 | Critique | Checkout / Finance | FAIL |
| BUG-05 | Critique | RLS / Confidentialité | FAIL (confirmé prod) |
| BUG-06 | Majeure | Portail vendeur / RLS | FAIL |
| BUG-07 | Majeure | Portail vendeur | FAIL |
| BUG-08 | Majeure | Checkout / Livraison | FAIL |
| BUG-09 | Majeure | Finance | FAIL |
| BUG-10 | Majeure | Checkout | FAIL |
| BUG-11 | Majeure | Configuration prod | FAIL (confirmé prod) |
| BUG-12 | Majeure | API / Sécurité | FAIL (12a confirmé prod) |
| BUG-13 | Moyenne | Suivi de commande | FAIL |
| BUG-14 | Moyenne | Promotions | FAIL |
| BUG-15 | Moyenne | Promotions / Suivi | FAIL |
| BUG-16 | Moyenne | Stock | FAIL |
| BUG-17 | Moyenne | Commandes | FAIL |
| BUG-18 | Moyenne | Super admin / Auth | FAIL |
| BUG-19 | Moyenne | Portail vendeur | FAIL |
| BUG-20 | Moyenne | Super admin | FAIL |
| BUG-21 | Moyenne | Auth | FAIL |
| BUG-22 | Mineure | API | FAIL |
| BUG-23 | Mineure | Portail vendeur | FAIL |
| BUG-24 | Mineure | Boutiques / Produits | FAIL |
| BUG-25 | Mineure | Super admin | FAIL |
| BUG-26 | Mineure | Documentation | FAIL |
| BUG-27 | Mineure | Storefront | FAIL |
| BUG-28 | Mineure | Portail vendeur | FAIL |
