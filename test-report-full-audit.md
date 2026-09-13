# Rapport de test — AchaVite, audit complet des 3 portails

Auteur : `qa` · Date : 2026-09-13
Commit audité : `a185e3d`
Cible : production `https://achavite.vercel.app` (Vercel, gru1) + code local `C:\Users\HP\AchaVite`
Rapport de bugs associé : `bug-report-full-audit.md`

---

## 1. Statut global

> ## **FAIL**
>
> 2 défauts CRITICAL et 4 HIGH bloquent le passage de phase.
> Le tunnel d'inscription vendeur payant — la fonctionnalité centrale de la
> livraison auditée — est **cassé dans les deux sens** : le chemin Pro légitime est
> impossible à terminer (BUG-A02), tandis qu'un chemin illégitime totalement gratuit
> reste ouvert (BUG-A01).

**Synthèse chiffrée**

| | |
|---|---|
| Cas de test exécutés | 118 |
| PASS | 93 |
| FAIL | 21 |
| BLOCKED | 4 |
| Bugs ouverts | 21 (2 CRITICAL · 4 HIGH · 8 MEDIUM · 7 LOW) |
| Régressions techniques (tsc / eslint / build / vitest) | **0** |

---

## 2. Contraintes et périmètre

**Contraintes respectées**
- Aucun fichier source modifié (aucun `Edit`/`Write` dans `src/`, `supabase/`).
- Aucune donnée de test volontairement laissée en base : les tentatives d'écriture ont
  toutes visé des cas d'erreur (payloads invalides, codes d'accès inexistants) qui ne
  persistent rien.
- **Exception à signaler** : la preuve d'exploitation de BUG-A01 a, par nature,
  créé un compte réel. **À supprimer :
  `qa-evil@example.com` / `user_id = d6f6b1cc-ea82-41a2-8b1f-636ee0869ce0`**
  (auth.users + la ligne `public.profiles` créée par le trigger). Aucune boutique
  ni abonnement n'y est rattaché.

**Non testable sans identifiants (→ BLOCKED)**
- B-01 Parcours vendeur authentifié complet (dashboard, produits, stock, commandes, livraison, promotions, abonnement, centre de paiement, 2FA TOTP).
- B-02 Parcours Super Admin authentifié (validation/refus de boutique, 9 sous-pages Monétisation, confirmation de candidature de bout en bout).
- B-03 Bascule réelle `subscription_plans.is_active = false` (chemin « offre gratuite »).
- B-04 Envoi d'e-mails réel (Gmail SMTP non configuré en production).

Pour ces zones, l'analyse repose sur la lecture croisée du code, des migrations SQL et
des politiques RLS — les défauts relevés y sont donc démontrés par le code et non par
l'observation, ce qui est indiqué au cas par cas dans le rapport de bugs.

---

## 3. Régression technique

Les quatre commandes ont été exécutées localement sur le commit `a185e3d`.

| Commande | Résultat | Code de sortie |
|---|---|---|
| `npx tsc --noEmit` | Aucune erreur de typage | **0** |
| `npx eslint src --max-warnings=9999` | Aucune sortie (0 erreur, 0 avertissement) | **0** |
| `npx next build` | Build complet réussi | **0** |
| `npx vitest run` | `2 fichiers · 35 tests` — `pricing.test.ts` (19) + `subscriptionLifecycle.test.ts` (16), tous verts, 878 ms | **0** |

**Statut régression technique : PASS.** Aucune régression de compilation, de lint, de
build ou de test unitaire.

**Réserve sur la couverture de tests :** les 35 tests ne couvrent que deux modules purs
(`src/lib/payments/pricing.ts`, `src/lib/payments/subscriptionLifecycle.ts`). Il n'existe
**aucun** test sur les 10 routes API, sur `buyerAuth.ts`, sur les helpers `src/lib/db/*`,
ni sur les composants. BUG-A02 (`planCode` figé) et BUG-A05 (succès sur 0 ligne) auraient
été détectés par un test unitaire trivial. Couverture effective estimée : **< 10 %** du
code applicatif.

---

## 4. Résultats par portail

### 4.1 PORTAIL ACHETEUR — **FAIL**

| # | Fonctionnalité | Cas exécutés | Statut | Défauts |
|---|---|---|---|---|
| AC-01 | Accueil `/` | 3 | PASS | — |
| AC-02 | Catalogue `/catalogue`, `/boutique` | 6 | PASS | — |
| AC-03 | Pages catégorie `/categorie/[slug]` | 4 | PASS | — |
| AC-04 | Fiche produit `/produit/[slug]` | 5 | **FAIL** | BUG-A15 (soft-404) |
| AC-05 | Panier `/panier` | 2 | PASS | — |
| AC-06 | Checkout connecté | 7 | PASS | — |
| AC-07 | Checkout invité | 2 | **FAIL** | BUG-A14 |
| AC-08 | Inscription par téléphone | 8 | **FAIL** | BUG-A13, BUG-A08, BUG-A09 |
| AC-09 | Connexion / déconnexion par téléphone | 5 | **FAIL** | BUG-A13 (normalisation asymétrique) |
| AC-10 | Mot de passe oublié acheteur | 3 | **FAIL** | BUG-A03 |
| AC-11 | Non-exposition de l'e-mail synthétique | 4 | **PASS** | — |
| AC-12 | Suivi de commande `/suivi` + `/api/orders/lookup` | 6 | PASS | — |
| AC-13 | Page contact `/contact` | 5 | PASS (dégradation propre) | BUG-A18 (LOW) |
| AC-14 | Pages légales (`/conditions`, `/confidentialite`, `/faq`, `/avis-important`) | 4 | PASS | — |
| AC-15 | Redirections post-login | 3 | **FAIL** | BUG-A04 (open redirect) |

**Détail des cas notables**

*AC-11 — Non-exposition de l'e-mail synthétique (exigence prioritaire) : **PASS**.*
`isSyntheticEmail()` est appliqué aux deux seuls points où `user.email` peut atteindre
l'interface acheteur :
- `src/app/compte/page.tsx` l. 33 → `realEmail` vaut `""`, l'affichage retombe sur
  `profile.name` / `profile.phone`, alimentés par le trigger `handle_new_user()` depuis
  `user_metadata` (migration 0003). Ni `buyer+…@achavite.internal` ni une chaîne vide
  ne s'affichent.
- `src/app/checkout/page.tsx` l. 76 → le champ « Email (optionnel) » reste **vide** pour un
  compte téléphone, conformément à l'exigence. La validation « produit numérique ⇒ email
  obligatoire » (l. 189-192) reste cohérente.
Aucune autre occurrence de `user.email` n'existe côté acheteur (vérifié par `grep`).

*AC-08/AC-09 — Validation du numéro : **FAIL**.* Sondes production :
```
{"name":"QA","phone":"66000000",...}  → 400 « Numéro invalide. Utilisez le format international, ex : +2356600000. »
{"name":"   ", ...}                   → 400 « Merci de renseigner votre nom complet. »
{"password":"123"}                    → 400 « …au moins 8 caractères. »
corps 'xxx' (JSON malformé)           → 500, corps vide          ← BUG-A09
nom de 5000 caractères                → 400 (rejeté sur le téléphone d'abord)
```
Les messages sont clairs et en français, mais l'exemple `+2356600000` est un numéro
tchadien invalide (7 chiffres après l'indicatif au lieu de 8) et aucun format local
n'est accepté. La connexion, elle, ne valide rien : les deux côtés peuvent diverger.

*AC-04 — Soft-404 : **FAIL**.* `/produit/inexistant-xyz` → HTTP **200** avec
`<title>Produit introuvable</title>`. `/categorie/inexistant-xyz` → **404** correct :
l'incohérence est interne au projet.

*AC-12 — Suivi invité : **PASS**.* La faille d'énumération par joker est bien fermée :
`{"code":"AV-%","phone":"%"}` → 400 (regex `^AV-[0-9A-F]{8}$`) ; code inexistant + téléphone
→ 404 générique, sans distinction entre « code inconnu » et « téléphone qui ne correspond pas ».

*AC-13 — Contact : **PASS**.* Payload complet → **503** avec
« L'envoi d'e-mails n'est pas encore configuré. Contactez-nous directement par WhatsApp. »
La dégradation demandée fonctionne : pas de 500 brut. E-mail invalide → 400 ; message de
6000 caractères → 400 « Message trop long. ».

---

### 4.2 PORTAIL VENDEUR — **FAIL**

| # | Fonctionnalité | Cas | Statut | Défauts |
|---|---|---|---|---|
| VE-01 | `/vendeur/offres` — catalogue des offres | 6 | PASS | — |
| VE-02 | `/vendeur/offres` — `is_active = true` (paiement requis) | 4 | PASS | — |
| VE-03 | `/vendeur/offres` — `is_active = false` (accès gratuit) | 2 | **BLOCKED** | B-03 |
| VE-04 | `/vendeur/paiement` — déclaration de paiement | 5 | PASS | BUG-A20 (LOW) |
| VE-05 | `/vendeur/creation-compte` — vérification du code | 4 | PASS | — |
| VE-06 | **Tunnel payant Mode Free (trial) de bout en bout** | 3 | PASS (par analyse) | — |
| VE-07 | **Tunnel payant Mode Pro de bout en bout** | 3 | **FAIL** | **BUG-A02 (CRITICAL)** |
| VE-08 | Tentatives de contournement du tunnel | 6 | **FAIL** | **BUG-A01 (CRITICAL)** |
| VE-09 | Écran de confirmation de création | 2 | **FAIL** | BUG-A10 |
| VE-10 | Connexion vendeur + 2FA optionnelle | 4 | PASS (par analyse) | — |
| VE-11 | Mot de passe oublié vendeur | 2 | **FAIL** | BUG-A03 (note) |
| VE-12 | Dashboard / produits / stock / commandes / livraison / promotions | 8 | **BLOCKED** | B-01 |
| VE-13 | `/admin/abonnement` | 3 | PASS (par analyse) | — |
| VE-14 | `/admin/parametres/paiement` — centre multi-pays | 4 | PASS (par analyse) | — |
| VE-15 | Documents — upload | 5 | **FAIL** | **BUG-A06 (HIGH)** |
| VE-16 | Documents — ouverture / autorisation | 4 | PASS | BUG-A16 (LOW) |
| VE-17 | Gardes de routes du portail | 4 | PASS | — |

**Détail des cas notables**

*VE-01/VE-02 — **PASS**.* `/vendeur/offres` rend en direct (`export const revalidate = 0`) :
les deux cartes affichent « Paiement requis » (6 occurrences, 0 « Accès gratuit ») et le prix
provient bien de `subscription_plans` — aucun prix codé en dur n'est affiché. La logique
« plan absent ⇒ paiement requis » (fail-safe) est correcte, et `getActivePlan()` ne filtre
plus sur `is_active`, conformément aux migrations 0011/0013.

*VE-07 — Tunnel Mode Pro : **FAIL (CRITICAL)**.* Le formulaire de création de compte
déduit `planCode` de la query string, or le lien du bouton « J'ai reçu mon code »
(`vendeur/paiement/page.tsx` l. 103) **et** le lien du message WhatsApp envoyé par le
Super Admin (`candidatures/page.tsx` l. 78) pointent tous deux vers
`/vendeur/creation-compte` **sans `?offre`**. `planCode` vaut donc toujours `"trial"`, et
`/api/vendeur/creer-compte` rejette en 403 sur `found.plan_code !== planCode`. Le
`planCode` correct est pourtant renvoyé par `/api/vendeur/verifier-code` mais ignoré par
le client. **Aucun client Pro ayant payé ne peut créer son compte**, et le message affiché
(« Le paiement n'a pas été confirmé ») accuse à tort le paiement.

*VE-08 — Contournements : **FAIL (CRITICAL)**.* Le durcissement de
`/api/vendeur/creer-compte` est réel et efficace — sondes production :
```
planCode=pro_monthly, sans accessCode → 403 « Le paiement n'a pas été confirmé… »
planCode=trial,       sans accessCode → 403 (idem)
planCode="hacker"                     → 400 « Offre invalide. »
accessCode="ZZZZZZZZZZ"               → {"valid":false}
```
**Mais la route héritée `/api/admin/register` n'a jamais été supprimée** et crée un compte
`role: vendor` sans authentification ni paiement (200 + `userId`). La page
`/admin/inscription` a bien été neutralisée (307 → `/vendeur/offres`) ; l'API sous-jacente,
non. Le portail vendeur reste accessible car le garde d'abonnement échoue ouvert quand le
compte n'a pas encore de boutique.

*VE-15 — Upload de documents : **FAIL (HIGH)**.* Trois limites contradictoires (15 Mo
annoncés / 5 Mo validés / ~4,5 Mo réellement acceptés par Vercel). Un fichier de 4,9 Mo
est rejeté **avant** la route par la plateforme :
```
HTTP 413 · Request Entity Too Large · FUNCTION_PAYLOAD_TOO_LARGE
```
Le client fait `res.json()` sur ce corps texte ⇒ le vendeur voit une `SyntaxError`
JavaScript en anglais. Le contrôle d'accès est en revanche correct (401 sans session,
403 si la boutique n'appartient pas à l'appelant, 405 en GET).

*VE-16 — Ouverture de documents : **PASS**.* `/api/documents?id=…` : 400 sans id, **401**
sans session, autorisation « propriétaire ou super_admin » vérifiée via `createAdminClient()`,
URL signée 5 min, compatibilité descendante avec les anciennes URL Cloudinary. La migration
Cloudinary → bucket privé Supabase est fonctionnellement saine.

---

### 4.3 PORTAIL ADMINISTRATEUR — **FAIL**

| # | Fonctionnalité | Cas | Statut | Défauts |
|---|---|---|---|---|
| AD-01 | Connexion Super Admin + garde de rôle | 4 | PASS | — |
| AD-02 | Boutiques — liste et dossier `/super-admin/stores/[id]` | 4 | PASS | BUG-A19 (LOW) |
| AD-03 | Boutiques — validation / refus | 3 | **BLOCKED** | B-02 |
| AD-04 | Utilisateurs / Produits / Commandes / Commissions / Paiements / Catégories | 6 | **BLOCKED** | B-02 |
| AD-05 | Monétisation — Plans (bascule `is_active`) | 4 | **FAIL** | BUG-A11 |
| AD-06 | Monétisation — Candidatures vendeur | 6 | **FAIL** | **BUG-A05 (HIGH)**, BUG-A07 |
| AD-07 | Monétisation — Moyens de paiement | 3 | **FAIL** | BUG-A17 |
| AD-08 | Monétisation — Pays / Prestataires / Abonnements / Paiements / Factures / Promotions / Revenus | 7 | **BLOCKED** | B-02 |
| AD-09 | Cache de schéma (« column not found ») | 5 | PASS | voir réserve §6 |
| AD-10 | Cron rappels d'abonnement | 2 | PASS | — |

**Détail des cas notables**

*AD-01 — **PASS**.* `super-admin/layout.tsx` et `admin/(protected)/layout.tsx` appliquent
tous deux : session → contrôle AAL2 (2FA) → lecture du rôle → redirection croisée
(vendor↔super_admin). Production : `/super-admin`, `/super-admin/monetisation/candidatures`,
`/admin`, `/admin/abonnement`, `/admin/parametres/paiement` → **307** vers `/admin/connexion`.
Un compte `customer` qui tenterait `/admin/connexion` est déconnecté par
`resolveRoleRedirect()` avec un message explicite.

*AD-06 — Candidatures : **FAIL (HIGH)**.* Deux défauts cumulés :
1. `confirmVendorApplication()` génère le code **avant** l'écriture et renvoie un succès
   même quand l'`UPDATE` (gardé par `.eq("status","pending")`) n'affecte aucune ligne →
   le Super Admin peut transmettre un code inexistant (BUG-A05).
2. Le code est produit par `Math.random()` dans le navigateur, pas par un CSPRNG,
   contrairement à ce qu'affirme le commentaire du code (BUG-A07). Combiné à l'absence
   totale de limitation de débit sur `/api/vendeur/verifier-code` (25 requêtes, 0 réponse 429),
   et au fait que cet endpoint révèle l'e-mail du payeur sur code valide.

*AD-09 — Cache de schéma : **PASS observé**.* Aucune erreur « column not found in schema
cache » rencontrée sur les pages atteignables. `/super-admin/stores/[id]` utilise
`select("*")`, immunisé par construction, et la colonne `stores.rejection_reason` existe bien
depuis 0001 (re-appliquée en 0010). **Réserve importante** : voir §6, la migration 0009 qui
installe les déclencheurs d'auto-reload n'a pas pu être vérifiée.

*AD-10 — **PASS**.* `/api/cron/subscription-reminders` sans en-tête → **401**
`{"error":"Unauthorized"}`. `sendReminderEmail()` est en `try/catch` et n'interrompt jamais
la tâche si le SMTP manque ; l'entrée d'audit `subscription_cron.completed` sert de
battement de cœur.

---

## 5. Tests transverses

### 5.1 Sécurité

| Contrôle | Statut | Observation |
|---|---|---|
| En-têtes de sécurité | **PASS** | CSP (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`), HSTS 2 ans + preload, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Open redirect | **FAIL** | `/auth/callback?redirect=https://example.com/evil` → 307 vers le domaine externe (BUG-A04) |
| Contrôle d'accès sur les routes protégées | **PASS** | 307 systématique sans session |
| Contrôle d'accès sur les API | **PASS sauf 1** | 401/403 corrects partout, **sauf `/api/admin/register`** (BUG-A01) |
| Limitation de débit | **FAIL** | 0 réponse 429 sur 40 requêtes (BUG-A08) |
| Énumération / injection sur le suivi de commande | **PASS** | joker ILIKE fermé, 404 générique |
| Qualité du générateur de secrets | **FAIL** | `Math.random()` (BUG-A07) |
| Fuite d'informations dans les erreurs | **PASS sauf 1** | messages normalisés, sauf `/api/admin/register` (BUG-A21) |
| Injection HTML dans les e-mails | **PASS** | `escapeHtml()` appliqué au corps (trop zélé sur l'objet — BUG-A18) |
| Validation de l'hôte des fichiers numériques | **PASS** | `TRUSTED_FILE_HOST = res.cloudinary.com` cohérent : les fichiers produits restent sur Cloudinary, seuls les justificatifs ont migré |

### 5.2 Gestion des erreurs et cas limites

| Cas | Statut |
|---|---|
| Entrée vide (tous les formulaires) | PASS — messages français explicites |
| Entrée invalide (e-mail, téléphone, plan, méthode de paiement) | PASS |
| Valeurs limites (message 6000 car., nom 5000 car., fichier 4,9 Mo) | PASS sauf fichier (BUG-A06) |
| **Corps JSON malformé** | **FAIL — 500 brut sur 9 routes / 9** (BUG-A09) |
| Double soumission | PASS côté UI (`disabled={submitting}` partout) — **FAIL** côté serveur pour la confirmation de candidature (BUG-A05) |
| Accès non autorisé | PASS (sauf BUG-A01) |
| Mauvaise méthode HTTP | PASS — 405 |
| Ressource inexistante | PASS sauf fiche produit (BUG-A15) |
| Configuration manquante (SMTP, Cloudinary) | PASS — 503 avec message clair, jamais de 500 |

### 5.3 Performance

Temps de réponse mesurés (`curl`, premier accès, production, cold start possible) :

| Page | Temps |
|---|---|
| `/` | 3,6 s |
| `/catalogue` | 3,4 s |
| `/boutique` | **7,0 s** |
| `/panier` | 2,0 s |
| `/vendeur/offres` | 3,4 s |
| `/produit/[slug]` | **6,9 s** |
| `/categorie/[slug]` | **6,9 s** |

**Statut : PASS avec réserve.** Aucune page en échec, mais `/boutique`, `/produit/[slug]` et
`/categorie/[slug]` dépassent 6,5 s au premier accès — inacceptable sur un marché à
connectivité mobile limitée. Les pages produit/catégorie sont rendues côté client
(`ProductPageClient`), ce qui ajoute un aller-retour Supabase après l'hydratation.
Recommandation : rendre les données produit côté serveur et ne garder le client que pour
l'interactivité. Non retenu comme bug (hors périmètre fonctionnel), mais à porter à
`architect`/`product`.

### 5.4 Accessibilité

**Statut : FAIL** (BUG-A12). Mesure sur l'ensemble de `src` :
`100 <input>`, `22 <label>`, **`0 htmlFor`**, `9 aria-label`. Aucun champ n'a
d'intitulé programmatiquement associé sur les 3 portails. Les `<Image>` portent en
revanche tous un `alt` (25/25).

### 5.5 Responsive / Android / iOS

**Statut : BLOCKED partiel.** Aucun navigateur réel ni appareil n'était disponible dans cet
environnement d'audit. L'analyse statique montre un usage systématique et cohérent des
préfixes Tailwind `sm:`/`lg:` et des conteneurs `max-w-*` sur toutes les pages lues, ainsi
que des cibles tactiles correctement dimensionnées (`py-3`/`py-3.5` sur les boutons
d'action). **Recommandation : faire exécuter une passe manuelle sur Android et iOS
réels avant mise en production** — en particulier `/checkout` (formulaire long, sélecteurs
de ville et de point relais) et `/admin/parametres/paiement` (grille de 12 prestataires).

---

## 6. Réserves de vérification (à traiter par `developer`)

1. **Migration 0009 — déclencheurs d'auto-reload PostgREST.** Sur Supabase hébergé, le rôle
   `postgres` n'est pas superutilisateur et `CREATE EVENT TRIGGER` échoue habituellement en
   `42501 permission denied`. Si 0009 n'est pas réellement appliquée, la cause racine des
   erreurs « column not found in schema cache » **subsiste** et ressurgira à la prochaine
   migration. Vérification :
   `select evtname, evtenabled from pg_event_trigger where evtname like 'pgrst%';`
2. **Migration 0013 non observable.** Les deux plans étant `is_active = true` en production,
   le chemin « offre gratuite » n'a pas pu être exercé. À rejouer après correction de BUG-A02.
3. **Compte de test à supprimer** : `qa-evil@example.com` /
   `d6f6b1cc-ea82-41a2-8b1f-636ee0869ce0` (créé comme preuve de BUG-A01).

---

## 7. Recommandation au `controller`

**Ne pas valider le passage de phase.** Trois lots de correction, par ordre :

**Lot 1 — bloquant, à corriger avant toute autre chose**
- BUG-A01 — supprimer `src/app/api/admin/register/route.ts` (aucun appelant applicatif).
- BUG-A02 — propager le `planCode` retourné par `/api/vendeur/verifier-code` jusqu'à
  `/api/vendeur/creer-compte`.
- Puis **rejouer intégralement VE-06, VE-07 et VE-08**, plan Free **et** plan Pro, avec
  `is_active = true` **et** `is_active = false`.

**Lot 2 — HIGH, avant mise à disposition des utilisateurs**
- BUG-A03 — ouvrir un chemin de récupération de mot de passe acheteur (a minima un lien
  « Mot de passe oublié » sur `/connexion` menant à une reprise en charge WhatsApp, tant
  qu'aucun canal SMS n'existe).
- BUG-A04 — n'autoriser que les redirections internes (`/…`, hors `//` et `/\`).
- BUG-A05 — `.select()` sur les mutations et vérification du nombre de lignes affectées.
- BUG-A06 — aligner le texte sur 4 Mo, contrôler la taille côté client, tolérer une
  réponse non-JSON.

**Lot 3 — MEDIUM/LOW, à planifier**
- BUG-A07 à BUG-A21, dans l'ordre du tableau d'index.

**Demandes complémentaires**
- Faire trancher par `product` le cas BUG-A14 (checkout invité) : soit le rétablir, soit
  retirer les mentions « sans compte » de `/connexion` et `/compte`.
- Demander à `architect` une décision sur la limitation de débit (BUG-A08) : middleware
  Next.js, Vercel Firewall, ou table Postgres de compteurs.
- Ouvrir un chantier de tests pour les routes API : la couverture actuelle (< 10 %, deux
  modules purs) n'aurait détecté aucun des défauts CRITICAL de cet audit.

---

## 8. Hand-off

```
## QA — RÉSULTAT
Statut global : FAIL

Cas exécutés / échoués : 118 exécutés · 93 PASS · 21 FAIL · 4 BLOCKED

Statut par portail :
  - Portail ACHETEUR       : FAIL  (5 fonctionnalités en échec sur 15)
  - Portail VENDEUR        : FAIL  (5 en échec, 2 bloquées sur 17)
  - Portail ADMINISTRATEUR : FAIL  (3 en échec, 3 bloquées sur 10)
  - Régression technique   : PASS  (tsc 0 · eslint 0 · next build OK · vitest 35/35)

Bugs ouverts (21) :
  CRITICAL  BUG-A01  /api/admin/register : compte vendeur gratuit, non authentifié
  CRITICAL  BUG-A02  Tunnel payant Mode Pro impossible à terminer (planCode figé à "trial")
  HIGH      BUG-A03  Aucune récupération de mot de passe acheteur
  HIGH      BUG-A04  Open redirect non authentifié sur /auth/callback
  HIGH      BUG-A05  « Code généré » affiché sur un UPDATE à 0 ligne
  HIGH      BUG-A06  Justificatifs : 15 Mo annoncés, 4,5 Mo réels, erreur Vercel brute
  MEDIUM    BUG-A07  Code d'accès généré avec Math.random()
  MEDIUM    BUG-A08  Aucune limitation de débit sur les API publiques à écriture
  MEDIUM    BUG-A09  JSON malformé → 500 brut sur 9 routes / 9
  MEDIUM    BUG-A10  « Votre boutique est active » alors qu'elle est pending
  MEDIUM    BUG-A11  Mutations silencieusement sans effet (updatePlan, reject, setActive)
  MEDIUM    BUG-A12  Accessibilité : 100 <input>, 0 htmlFor
  MEDIUM    BUG-A13  Format de téléphone imposé + exemple erroné (+2356600000)
  MEDIUM    BUG-A14  Checkout invité impossible mais annoncé ailleurs
  LOW       BUG-A15  Soft-404 sur /produit/[slug] inexistant (HTTP 200)
  LOW       BUG-A16  Fichier orphelin dans le bucket après suppression
  LOW       BUG-A17  6 prestataires sur 12 dans Monétisation → Moyens de paiement
  LOW       BUG-A18  escapeHtml appliqué aux objets d'e-mail
  LOW       BUG-A19  Dossier boutique quasi vide pour tout vendeur du tunnel payant
  LOW       BUG-A20  Montant/plan de candidature déclarés par le visiteur
  LOW       BUG-A21  Erreur Supabase brute renvoyée par /api/admin/register

Régressions par rapport au dernier audit : aucune régression technique.
Les correctifs précédemment livrés sont confirmés tenus :
  - récursion RLS orders/order_items : corrigée, catalogue public fonctionnel
  - énumération par joker sur /api/orders/lookup : fermée
  - e-mail synthétique acheteur : jamais exposé (/compte, /checkout)
  - dégradation propre du mailer (503, jamais 500)
  - en-têtes de sécurité : complets
Les 2 défauts CRITICAL ne sont pas des régressions mais des angles morts
du tunnel payant introduit récemment (BUG-A02) et un reliquat de l'ancien
parcours d'inscription vendeur gratuit jamais nettoyé (BUG-A01).

Action requise hors correctif : supprimer le compte de preuve
qa-evil@example.com / d6f6b1cc-ea82-41a2-8b1f-636ee0869ce0

Recommandation au controller : BLOQUER le passage de phase.
Renvoyer le lot 1 (BUG-A01, BUG-A02) à `developer` immédiatement, puis
demander une re-vérification QA ciblée du tunnel vendeur (VE-06/07/08)
avant d'examiner les lots 2 et 3.
```
