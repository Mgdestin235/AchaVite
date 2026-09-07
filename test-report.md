# AchaVite — Rapport de test QA

- **Agent** : 06 — QA TESTER (passe indépendante, lecture seule sur le code)
- **Date** : 2026-09-07
- **Version testée** : `C:\Users\HP\AchaVite` (local) + déploiement `https://achavite.vercel.app`
- **Statut global** : **FAIL** — 5 défauts critiques (sécurité / élévation de privilèges / intégrité financière) et 7 défauts majeurs bloquants fonctionnellement.

---

## 1. Périmètre

| Zone | Couverte | Méthode |
|---|---|---|
| Checkout multi-vendeur (frais livraison, promo scopée, absence de zone) | Oui | Revue de code + réimplémentation isolée de la logique + assertions Node |
| Création de commande (commission, payout, décrément stock) | Oui | Revue de code + tests isolés + revue de la fonction SQL |
| Suivi de commande invité (`/api/orders/lookup`, normalisation téléphone) | Oui | Tests unitaires isolés + appels HTTP réels sur la prod |
| Portail vendeur (produits / commandes / stock / promotions / livraison) | Oui | Revue de code + croisement types composants ↔ `src/lib/db/*` ↔ policies RLS |
| Portail super admin (approbation boutiques, validation paiement, livraison numérique) | Oui | Revue de code + sondes HTTP |
| RLS ↔ suppositions applicatives | Oui | Lecture `supabase/migrations/*.sql` + sondes REST anonymes read-only |
| Build / lint | Oui | `npx next build`, `npx eslint src --max-warnings=9999` |
| Rendu visuel, responsive, Android, iOS, PWA | **Non couvert** | Pas de navigateur dans l'environnement — à faire par un testeur manuel |
| Parcours E2E d'achat réel sur la prod | **BLOQUÉ** | Aucun produit publié et aucun moyen de paiement activé en base (voir BUG-11) |

Aucune écriture n'a été faite en base de production. Les sondes REST utilisées sont exclusivement des `SELECT` avec la clé publique anon. Aucune clé n'est reproduite dans ce rapport.

---

## 2. Environnement

- Next.js 16.3.2 / React 19.2.8 / Supabase JS 2.115
- Base Supabase de production `gwhfeudlshupsplhqbbm` (schéma `0001` + `0002` appliqués)
- État réel de la base au moment du test : 1 boutique approuvée (« Destiny »), **0 produit publié**, **0 zone de livraison**, **0 code promo**, 9 profils, 0 commande visible en anon.
- `platform_settings` : commission 10 %, `whatsapp_number = null`, MTN / Airtel / Moov / Banque **tous désactivés**.

---

## 3. Résultats build & lint

| Cas | Commande | Résultat |
|---|---|---|
| TC-BLD-01 | `npx next build` | **PASS** — code de sortie 0, 44 routes générées, aucune erreur TS |
| TC-BLD-02 | `npx eslint src --max-warnings=9999` | **PASS** — aucune sortie, aucun warning |

Observation : la route `/api/orders/by-phone`, référencée dans les commentaires de `0001_marketplace_schema.sql`, `0002_*.sql` et `src/lib/lastOrder.ts`, **n'existe pas** dans le build (voir BUG-26).

---

## 4. Cas de test exécutés

### 4.1 Checkout multi-vendeur (`src/app/checkout/page.tsx`)

Logique recopiée à l'identique et exécutée hors navigateur.

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-CHK-01 | 2 vendeurs, tous deux livrent la ville | 1 frais par vendeur (2000 + 1500 = 3500) | 3500 | PASS |
| TC-CHK-02 | Vendeur B n'a **pas** de zone pour la ville choisie | Refus ou frais explicite | Frais de B = 0, commande acceptée | **FAIL** (BUG-10) |
| TC-CHK-03 | Aucune zone configurée du tout | Refus ou message vendeur | « Livraison : Gratuite », commande acceptée | **FAIL** (BUG-10) |
| TC-CHK-04 | `has_relais = true` mais `relais_points` vide | Mode relais utilisable ou désactivé | Bouton actif, aucun `<select>` rendu, soumission bloquée en boucle | **FAIL** (BUG-08) |
| TC-CHK-05 | Promo scopée au vendeur A dans un panier A+B | Remise sur la part de A seulement | 1000 sur 10000 (A) uniquement | PASS |
| TC-CHK-06 | Promo « fixe » supérieure au sous-total du vendeur | Remise plafonnée | Plafonnée à 3000 | PASS |
| TC-CHK-07 | Promo « pourcentage » de 150 % | Refus à la création ou plafond | Total **négatif** (−5000 FCFA) | **FAIL** (BUG-14) |
| TC-CHK-08 | Double soumission du formulaire | Bouton désactivé | `submitting` désactive le bouton | PASS |
| TC-CHK-09 | Nom / téléphone / ville vides | Message d'erreur | Toast d'erreur correct | PASS |
| TC-CHK-10 | Produit numérique sans email | Blocage | Toast d'erreur correct | PASS |
| TC-CHK-11 | Article en rupture resté dans le panier | Refus | Commande acceptée, stock clampé à 0 en SQL | **FAIL** (BUG-16) |

### 4.2 Création de commande (`src/lib/db/orders.ts`)

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-ORD-01 | Commission 10 % sur 2 lignes | Arrondi par ligne, payout = sous-total − commission | 2000/18000 et 333/3000 | PASS |
| TC-ORD-02 | Commission face à une remise promo | Remise supportée par le vendeur émetteur | Remise supportée par la **plateforme** : marge 0 à 10 %, **−10 000 FCFA à 20 %** | **FAIL** (BUG-09) |
| TC-ORD-03 | Taux fractionnaire (7,5 %) | Arrondi cohérent | 225 / 2772 | PASS |
| TC-ORD-04 | Décrément de stock | Jamais négatif | `greatest(stock - qty, 0)` correct côté SQL | PASS |
| TC-ORD-05 | Échec d'insertion des `order_items` | Rollback | Aucune transaction : la commande reste créée sans lignes | **FAIL** (BUG-04, robustesse) |
| TC-ORD-06 | Unicité du code commande | Pas de collision | `AV-` + 6 hex, colonne UNIQUE, aucun retry | **FAIL** (BUG-17) |
| TC-ORD-07 | Incrément de `promos.used` | Compteur mis à jour | Jamais incrémenté, `max_uses` jamais vérifié | **FAIL** (BUG-14) |

### 4.3 Suivi de commande invité

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-TRK-01 | `POST /api/orders/lookup` corps vide | 400 | 400 « Code de commande et téléphone requis. » | PASS |
| TC-TRK-02 | Code sans téléphone | 400 | 400 | PASS |
| TC-TRK-03 | Code + téléphone inconnus | 404 générique | 404 générique (pas d'oracle d'existence) | PASS |
| TC-TRK-04 | JSON malformé | 400 | **500** (exception non capturée) | **FAIL** (BUG-22) |
| TC-TRK-05 | Code = `%` (joker SQL `ilike`) | Rejet | Requête exécutée, filtrage seulement par téléphone | **FAIL** (BUG-15) |
| TC-TRK-06 | `66 12 34 56` ↔ `66123456` | Match | Match | PASS |
| TC-TRK-07 | `66123456` ↔ `+235 66 12 34 56` | Match | **Pas de match** | **FAIL** (BUG-13) |
| TC-TRK-08 | `66123456` ↔ `00235 66123456` | Match | **Pas de match** | **FAIL** (BUG-13) |
| TC-TRK-09 | `(235) 66123456` ↔ `66123456` | Match | **Pas de match** | **FAIL** (BUG-13) |

Bilan des assertions automatisées : **29 PASS / 3 FAIL** (les 3 échecs sont TC-TRK-07/08/09).

### 4.4 Portail vendeur

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-VND-01 | `/admin/commandes` : afficher code, client, téléphone, paiement | Données visibles | Jointure `orders(...)` interdite par RLS pour un vendeur → champs vides | **FAIL** (BUG-06) |
| TC-VND-02 | Recherche par code / téléphone dans les commandes | Filtre fonctionnel | Filtre sur des champs nuls → inopérant | **FAIL** (BUG-06) |
| TC-VND-03 | Envoi automatique d'un produit numérique au passage « confirmée » | Envoi si paiement reçu | `payment_status` illisible → toujours « paiement pas encore confirmé » | **FAIL** (BUG-06) |
| TC-VND-04 | Tableau de bord : CA, commandes du jour, expédiées, livrées | Chiffres réels | Toutes les stats dépendent de `it.orders` → **0 partout** | **FAIL** (BUG-06) |
| TC-VND-05 | Cohérence statut vendeur ↔ statut affiché | Le vendeur fait avancer sa ligne | Le dashboard lit `orders.status`, jamais écrit nulle part | **FAIL** (BUG-07) |
| TC-VND-06 | Zones de livraison : saisir des points relais | Champ disponible | Aucun champ dans `VendorDeliveryClient` | **FAIL** (BUG-08) |
| TC-VND-07 | Stock : saisie clavier d'une quantité | 1 écriture après saisie | 1 écriture DB **par frappe**, champ vidé ⇒ stock=0 écrit | **FAIL** (BUG-19) |
| TC-VND-08 | Promotions : compteur « utilisations » | `used / max_uses` réel | `used` toujours 0, plafond non appliqué | **FAIL** (BUG-14) |
| TC-VND-09 | Produits : types `Vendor*.tsx` ↔ `lib/db/*.ts` | Cohérents | Cohérents (aucun écart de type détecté ; le build TS passe) | PASS |
| TC-VND-10 | Boutique non approuvée : accès aux produits | Bloqué / notice | Notice correcte selon `store.status` | PASS |
| TC-VND-11 | Formulaire produit sans image / sans prix | Message d'erreur | `return` silencieux, aucun retour utilisateur | **FAIL** (BUG-23) |

### 4.5 Portail super admin

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-SAD-01 | Accès non authentifié à `/super-admin*` | Redirection | 307 → `/admin/connexion` (vérifié en prod) | PASS |
| TC-SAD-02 | Accès non authentifié à `/admin*` | Redirection | 307 → `/admin/connexion` (vérifié en prod) | PASS |
| TC-SAD-03 | Approbation / refus / suspension d'une boutique | Réservé au super admin | Fonctionnel côté UI, **mais contournable par le vendeur lui-même** | **FAIL** (BUG-03) |
| TC-SAD-04 | Validation d'un paiement | `payment_status = reussi` | Fonctionnel | PASS |
| TC-SAD-05 | Déclenchement de la livraison numérique | Email envoyé | **503 : `RESEND_API_KEY` absent en production** | **FAIL** (BUG-11) |
| TC-SAD-06 | Paiement validé sans email client | Avertissement | Avertissement correct | PASS |
| TC-SAD-07 | CA / commissions plateforme | Basés sur les commandes payées | Comptent aussi les impayées et les refusées | **FAIL** (BUG-20) |
| TC-SAD-08 | Suspension d'un utilisateur | Perte d'accès | `profiles.status` n'est vérifié nulle part | **FAIL** (BUG-18) |
| TC-SAD-09 | Boutique suspendue : boutons d'action | Un seul bouton pertinent | « Approuver » **et** « Réactiver » affichés | **FAIL** (BUG-25, cosmétique) |

### 4.6 RLS ↔ code applicatif

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-RLS-01 | `orders` / `order_items` / `payments` en anonyme | Vides | Vides | PASS |
| TC-RLS-02 | `products` / `stores` en anonyme | Seulement actifs + approuvés | Conforme | PASS |
| TC-RLS-03 | `profiles` en anonyme | Non exposés | **9 profils lus (nom, téléphone, rôle) sans authentification** | **FAIL** (BUG-05) |
| TC-RLS-04 | Vendeur lisant `orders` via jointure | Autorisé (nécessaire au portail) | Aucune policy ne l'autorise | **FAIL** (BUG-06) |
| TC-RLS-05 | `orders` INSERT | Contrôlé serveur | `with check (true)` : n'importe qui insère n'importe quel montant | **FAIL** (BUG-04) |
| TC-RLS-06 | `orders` UPDATE par le client propriétaire | Champs restreints | Le client peut passer son propre `payment_status` à `reussi` | **FAIL** (BUG-04) |
| TC-RLS-07 | `profiles` UPDATE self | Rôle non modifiable | Le rôle est modifiable ⇒ auto-promotion super admin | **FAIL** (BUG-02) |
| TC-RLS-08 | `stores` UPDATE owner | Statut non modifiable | Le vendeur peut s'auto-approuver | **FAIL** (BUG-03) |
| TC-RLS-09 | Rôle issu du `user_metadata` au signup | Forcé à `customer` | Le trigger fait confiance au client ⇒ auto-promotion super admin | **FAIL** (BUG-01) |

### 4.7 API et sécurité applicative

| ID | Cas | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| TC-API-01 | `POST /api/upload` sans authentification | 401 | **200 + signature Cloudinary (40 c.) + apiKey** — vérifié en prod | **FAIL** (BUG-12) |
| TC-API-02 | `POST /api/send-digital-delivery` sans authentification | 401 | Aucun contrôle d'accès (masqué par le 503 clé manquante) | **FAIL** (BUG-12) |
| TC-API-03 | `POST /api/admin/register` en masse | Rate limit / captcha | Aucun ; crée des comptes vendeurs déjà confirmés | **FAIL** (BUG-12) |
| TC-API-04 | `POST /api/orders/set-payment-method` id invalide | 400 générique | **500 + erreur Postgres brute** | **FAIL** (BUG-22) |
| TC-API-05 | `POST /api/orders/set-payment-method` méthode invalide | 400 | 400 | PASS |
| TC-API-06 | Page 404 inconnue | 404 | 404 | PASS |

---

## 5. Synthèse

| Sévérité | Nombre |
|---|---|
| Critique | 5 |
| Majeure | 7 |
| Moyenne | 9 |
| Mineure | 7 |
| **Total** | **28** |

- Cas exécutés : **62**
- PASS : **26**
- FAIL : **36** (dont 12 bloquants pour le passage de phase)
- Non couverts : rendu visuel / responsive / Android / iOS / E2E d'achat réel

**Verdict : FAIL.** Le build et le lint passent, mais le modèle d'autorisation (RLS) présente trois chemins indépendants d'élévation vers `super_admin` ou d'auto-approbation, l'intégrité des montants n'est garantie nulle part côté serveur, et le portail vendeur ne peut pas afficher ses commandes à cause d'une policy manquante. Détail et étapes de reproduction : `bug-report.md`.

## 6. Recommandation de priorisation

1. BUG-01, BUG-02, BUG-03, BUG-04, BUG-05 (sécurité — à corriger avant toute autre chose).
2. BUG-06, BUG-07, BUG-08, BUG-09, BUG-10, BUG-11 (le produit n'est pas utilisable sans ça).
3. Le reste avant mise en service commerciale.
