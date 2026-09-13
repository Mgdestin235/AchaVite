# Rapport de bugs — AchaVite (audit complet 3 portails)

Auteur : `qa` · Date : 2026-09-13
Commit audité : `a185e3d` (Hide "Continuer avec Google"…)
Environnement : production `https://achavite.vercel.app` (Vercel, région gru1) + lecture de code local
Méthode : lecture de code croisée avec les specs + sondes `curl` non authentifiées contre la production

Sévérités utilisées (demande utilisateur) : **CRITICAL** / **HIGH** / **MEDIUM** / **LOW**.

---

## Index

| ID | Sévérité | Portail | Titre | Statut |
|---|---|---|---|---|
| BUG-A01 | CRITICAL | Vendeur | `/api/admin/register` : création de compte vendeur gratuite, non authentifiée, contourne tout le tunnel payant | ouvert |
| BUG-A02 | CRITICAL | Vendeur | Tunnel payant **Mode Pro** impossible à terminer : `planCode` figé à `trial` dans le flux par code | ouvert |
| BUG-A03 | HIGH | Acheteur | Aucun moyen de récupérer un mot de passe acheteur (compte sans e-mail) | ouvert |
| BUG-A04 | HIGH | Transverse | Open redirect non authentifié sur `/auth/callback?redirect=` (+ `/connexion`, `/inscription`) | ouvert |
| BUG-A05 | HIGH | Admin | « Code généré : XXXX » affiché même quand l'UPDATE n'a touché aucune ligne (code jamais persisté) | ouvert |
| BUG-A06 | HIGH | Vendeur | Upload de justificatif : « 15 Mo maximum » annoncé, 4,5 Mo réels, erreur Vercel brute non traduite | ouvert |
| BUG-A07 | MEDIUM | Vendeur | Code d'accès généré avec `Math.random()` (PRNG non cryptographique) | ouvert |
| BUG-A08 | MEDIUM | Transverse | Aucune limitation de débit sur les routes API publiques à écriture (`/api/inscription`, `/api/admin/register`, `vendor_applications`) | ouvert |
| BUG-A09 | MEDIUM | Transverse | 9 routes API sur 9 renvoient un **500 brut** sur un corps JSON malformé | ouvert |
| BUG-A10 | MEDIUM | Vendeur | « Votre boutique est active » affiché alors que la boutique est `pending` | ouvert |
| BUG-A11 | MEDIUM | Admin | Mutations silencieusement sans effet : `updatePlan`, `rejectVendorApplication`, `setPaymentProviderActive` toastent un succès sur 0 ligne | ouvert |
| BUG-A12 | MEDIUM | Transverse | Accessibilité : 100 `<input>`, 0 `htmlFor` — aucun label associé programmatiquement | ouvert |
| BUG-A13 | MEDIUM | Acheteur | Format de téléphone imposé + exemple erroné (`+2356600000` = 10 chiffres, numéro tchadien invalide) | ouvert |
| BUG-A14 | MEDIUM | Acheteur | Checkout invité impossible (redirection forcée vers `/connexion`) alors que le parcours invité est annoncé ailleurs | ouvert |
| BUG-A15 | LOW | Acheteur | Soft-404 : `/produit/<slug-inexistant>` renvoie HTTP 200 | ouvert |
| BUG-A16 | LOW | Vendeur | Suppression d'un justificatif : la ligne DB part, le fichier reste dans le bucket | ouvert |
| BUG-A17 | LOW | Admin | Seuls 6 des 12 prestataires sont proposés dans Monétisation → Moyens de paiement | ouvert |
| BUG-A18 | LOW | Transverse | `escapeHtml()` appliqué au **sujet** d'e-mail : « Jean D&#39;Arc » dans les objets | ouvert |
| BUG-A19 | LOW | Admin | Dossier boutique quasi vide pour tout vendeur issu du tunnel payant | ouvert |
| BUG-A20 | LOW | Vendeur | `vendor_applications` : montant/plan déclarés par le visiteur, jamais recalculés côté serveur | ouvert |
| BUG-A21 | LOW | Transverse | Erreur Supabase brute renvoyée au client par `/api/admin/register` | ouvert |

> **Nettoyage requis** : pendant la preuve d'exploitation de BUG-A01, un compte réel a été créé en base.
> **À supprimer par `developer` : `qa-evil@example.com`, `user_id = d6f6b1cc-ea82-41a2-8b1f-636ee0869ce0`** (+ sa ligne `public.profiles`).
> Aucun autre compte, boutique, commande ou candidature n'a été créé par cet audit.

---

## BUG-A01 — `/api/admin/register` : création de compte vendeur gratuite, non authentifiée

- **Sévérité :** CRITICAL
- **Module :** Portail vendeur — inscription / monétisation
- **Fichier :** `src/app/api/admin/register/route.ts`
- **Environnement :** production, aucun compte requis

**Contexte.** La page `src/app/admin/inscription/page.tsx` a été correctement neutralisée (elle `redirect("/vendeur/offres")`, confirmé HTTP 307 en production). **Mais la route API qu'elle appelait n'a jamais été supprimée** et reste publiquement exposée. Elle crée un utilisateur avec `user_metadata: { role: "vendor" }` et `email_confirm: true` via `createAdminClient()` (clé service-role), **sans authentification, sans code d'accès, sans vérification de plan, sans paiement**.

**Étapes de reproduction :**
1. Depuis n'importe quelle machine, sans aucun compte :
```bash
curl -X POST https://achavite.vercel.app/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-evil@example.com","password":"Password123","name":"Evil"}'
```
2. Observer la réponse.
3. Se connecter avec ces identifiants sur `/admin/connexion`.

**Résultat attendu :** `404` ou `410` — la route n'existe plus ; seul `/api/vendeur/creer-compte` (qui vérifie `subscription_plans.is_active` puis le code d'accès confirmé) peut créer un compte vendeur.

**Résultat obtenu (preuve, exécuté le 2026-09-13) :**
```
HTTP 200
{"ok":true,"userId":"d6f6b1cc-ea82-41a2-8b1f-636ee0869ce0"}
```

**Impact :**
- Le trigger `handle_new_user()` (migration 0003) crée le profil avec `role = 'vendor'` → l'accès à `/admin` est obtenu (`(protected)/layout.tsx` ne vérifie que `profile?.role === "vendor"`).
- Le vendeur n'a pas encore de boutique ; `(subscription-gated)/layout.tsx` **échoue ouvert** dans ce cas (`if (!store) return <>{children}</>`) → tout le portail vendeur est atteignable.
- Il peut ensuite créer sa boutique via `/admin/store` (formulaire ouvert à tout vendeur), ce qui pollue la file de validation Super Admin.
- **Contredit frontalement la promesse affichée** sur `/vendeur/paiement` : « Tant que le paiement n'est pas confirmé, aucun compte n'est créé. »
- Vecteur de création de comptes en masse sur le projet Supabase (aucun rate limit, cf. BUG-A08).

**Correctif attendu :** supprimer `src/app/api/admin/register/route.ts`. Aucun code applicatif ne l'appelle plus (`grep -rn "api/admin/register" src/` → 0 résultat hors la route elle-même).

---

## BUG-A02 — Tunnel payant Mode Pro impossible à terminer

- **Sévérité :** CRITICAL
- **Module :** Portail vendeur — tunnel d'inscription payant
- **Fichiers :** `src/app/vendeur/creation-compte/page.tsx` (l. 24-25, 106-118), `src/app/api/vendeur/creer-compte/route.ts` (l. 87), `src/app/vendeur/paiement/page.tsx` (l. 103), `src/app/super-admin/monetisation/candidatures/page.tsx` (l. 78)

**Cause racine.** Dans `creation-compte/page.tsx` :
```ts
const offre = searchParams.get("offre"); // "free" | "pro" | null (null = code flow)
const planCode = offre === "pro" ? "pro_monthly" : "trial";
```
Dans le **flux par code** (celui de tout client ayant payé), `offre` vaut `null` → **`planCode` vaut toujours `"trial"`**. Le client poste ce `planCode` figé :
```ts
body: JSON.stringify({ planCode, accessCode: unlocked ? accessCode : undefined, ... })
```
`/api/vendeur/verifier-code` renvoie pourtant bien le vrai `planCode` de la candidature — **le client l'ignore** (il n'utilise que `data.email`, l. 86).

Côté serveur (`creer-compte/route.ts` l. 87) :
```ts
if (!found || found.plan_code !== planCode) {
  return NextResponse.json({ error: FAILURE_MSG }, { status: 403 });
}
```
→ `"pro_monthly" !== "trial"` → **403**.

**Étapes de reproduction :**
1. `/vendeur/offres` → « Choisir le Mode Pro » (plan `pro_monthly`, `is_active = true`).
2. `/vendeur/paiement?offre=pro` → régler 15 000 FCFA → « J'ai effectué le paiement » (ligne `vendor_applications` avec `plan_code = 'pro_monthly'`).
3. Super Admin → Monétisation → Candidatures → « Confirmer le paiement » → un code est émis et envoyé par WhatsApp.
4. Le vendeur ouvre `/vendeur/creation-compte` (lien du bouton « J'ai reçu mon code » l. 103 **et** lien du message WhatsApp l. 78 — **aucun des deux ne porte `?offre`**).
5. Saisir le code → il est accepté (« Paiement confirmé ! »), l'e-mail est verrouillé, le formulaire s'affiche.
6. Remplir le formulaire → « Créer mon compte vendeur ».

**Résultat attendu :** le compte vendeur Pro est créé, la candidature passe en `consumed`, l'abonnement passe en `pro_active`.

**Résultat obtenu :** HTTP 403 et le message
> « Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer. »

…alors que le paiement **a** été confirmé par le Super Admin et que l'étape précédente (`verifier-code`) l'a explicitement validé. Le message est donc doublement trompeur, et le vendeur qui « réessaie » échouera indéfiniment.

**Aucun contournement possible :** essayer `/vendeur/creation-compte?offre=pro` bascule sur la branche « offre » qui lit `subscription_plans.is_active` ; comme `pro_monthly` est payant (`is_active = true`, vérifié en production), la page affiche « Cette offre nécessite un paiement → Aller au paiement ». Il n'existe **aucun chemin** permettant à un client Pro payant de créer son compte.

**Preuve indirecte (production, 2026-09-13) :** les deux plans sont bien en « Paiement requis » (`curl /vendeur/offres` → 6× « Paiement requis », 0× « Accès gratuit ») et `/api/vendeur/creer-compte` refuse correctement sans code pour `trial` comme pour `pro_monthly` (403 dans les deux cas) — la branche payante est donc bien active, donc le bug est atteint.

**Correctif attendu :** utiliser le `planCode` retourné par `/api/vendeur/verifier-code` (le stocker dans un state à côté de `lockedEmail`) et le poster à `creer-compte`, plutôt que celui déduit de l'URL.

---

## BUG-A03 — Aucun moyen de récupérer un mot de passe acheteur

- **Sévérité :** HIGH
- **Module :** Portail acheteur — authentification
- **Fichiers :** `src/app/connexion/page.tsx`, `src/app/mot-de-passe-oublie/page.tsx`, `src/lib/buyerAuth.ts`

**Étapes de reproduction :**
1. Créer un compte acheteur sur `/inscription` (nom + téléphone + mot de passe — aucun e-mail n'est demandé).
2. Se déconnecter, puis oublier le mot de passe.
3. Aller sur `/connexion`.

**Résultat attendu :** un lien « Mot de passe oublié ? » menant à un parcours de récupération utilisable avec le seul numéro de téléphone (SMS/OTP ou reprise en charge manuelle).

**Résultat obtenu :**
- `/connexion` **ne contient aucun lien « Mot de passe oublié »** (comparer : `/admin/connexion` l. 152-156 en a un). L'acheteur est en impasse.
- Même en atteignant `/mot-de-passe-oublie` directement, la page **exige un e-mail** (`type="email" required`, l. 60-67), alors que le compte n'en a pas.
- Si l'acheteur devinait l'e-mail synthétique (`buyer+2356…@achavite.internal`), `resetPasswordForEmail()` enverrait vers un domaine inexistant.
- Pire : la page **affiche toujours le bandeau vert de succès** (`setSent(true)` inconditionnel, l. 40), donc l'utilisateur croit avoir reçu un lien.

**Impact :** tout acheteur ayant oublié son mot de passe perd définitivement son compte et son historique de commandes. Le checkout étant réservé aux comptes connectés (BUG-A14), il perd aussi la possibilité de commander sous son identité.

**Note complémentaire (même famille, portail vendeur) :** `resetPasswordForEmail()` s'appuie sur l'expéditeur intégré de Supabase Auth. Les identifiants Gmail ne sont câblés que dans `src/lib/mailer.ts` (nodemailer), **pas** dans le SMTP Auth du projet Supabase, et `GMAIL_USER`/`GMAIL_APP_PASSWORD` sont absents de la production (cf. BUG-A03-bis ci-dessous). La réinitialisation vendeur est donc elle aussi très probablement non délivrée — et l'UI ne le dira jamais puisque toute erreur hors « rate limit » est avalée.

---

## BUG-A04 — Open redirect non authentifié sur `/auth/callback`

- **Sévérité :** HIGH
- **Module :** Transverse — authentification
- **Fichiers :** `src/app/auth/callback/route.ts` (l. 14, 21), `src/app/connexion/page.tsx` (l. 43), `src/app/inscription/page.tsx` (l. 60)

```ts
const redirectTo = url.searchParams.get("redirect") || "/boutique";
...
return NextResponse.redirect(new URL(redirectTo, url.origin));
```
`new URL(absoluteUrl, origin)` **ne contraint pas** à l'origine : une URL absolue ou protocole-relative écrase la base.

**Étapes de reproduction (production, aucune authentification) :**
```bash
curl -sI "https://achavite.vercel.app/auth/callback?redirect=https://example.com/evil"
curl -sI "https://achavite.vercel.app/auth/callback?redirect=//example.com/evil"
```

**Résultat attendu :** redirection vers un chemin interne uniquement (ou `/boutique` par défaut).

**Résultat obtenu (preuve, 2026-09-13) :**
```
HTTP/1.1 307 Temporary Redirect
Location: https://example.com/evil
```
(identique pour la forme protocole-relative `//example.com/evil`)

**Impact :** hameçonnage à fort taux de réussite — un lien commençant par `https://achavite.vercel.app/auth/callback?...` inspire confiance et ressemble à une URL d'authentification légitime, mais aboutit sur un site tiers (faux `/connexion` AchaVite, par exemple).

**Même défaut côté client :** `/connexion?redirect=https://evil.com` et `/inscription?redirect=https://evil.com` — `router.push(searchParams.get("redirect") || "/boutique")` sans validation. Exploitable après login réussi.

**Correctif attendu :** n'accepter que les redirections commençant par `/` et ne commençant pas par `//` ni `/\`, sinon retomber sur `/boutique`.

---

## BUG-A05 — « Code généré » affiché alors que rien n'a été persisté

- **Sévérité :** HIGH
- **Module :** Super Admin — Monétisation → Candidatures vendeur
- **Fichiers :** `src/lib/db/vendorApplications.ts` (l. 49-67), `src/app/super-admin/monetisation/candidatures/page.tsx` (l. 47-56)

```ts
const code = generateAccessCode();           // généré AVANT et INDÉPENDAMMENT de l'écriture
const { error } = await supabase
  .from("vendor_applications")
  .update({ status: "confirmed", access_code: code, ... })
  .eq("id", id)
  .eq("status", "pending");                  // garde : 0 ligne si déjà confirmée
if (error) return { code: null, error: error.message };
return { code, error: null };                // ← succès renvoyé même sur 0 ligne affectée
```
Un `UPDATE` PostgREST **sans `.select()`** ne renvoie pas d'erreur quand il ne touche aucune ligne. La page affiche alors :
```ts
toast.success(`Code généré : ${code}`);
```

**Étapes de reproduction (A — double clic / double onglet) :**
1. Super Admin → Monétisation → Candidatures.
2. Sur une candidature `pending`, cliquer « Confirmer le paiement », valider la `confirm()`.
3. Sans attendre le rafraîchissement, recliquer « Confirmer le paiement » (ou le faire depuis un second onglet ouvert avant).

**Étapes de reproduction (B — RLS) :** exécuter la même action avec une session dont `profiles.status` n'est pas `active` (`current_role()` renvoie `NULL`, la policy `vendor_applications_update_admin` refuse silencieusement).

**Résultat attendu :** un seul code est émis ; la seconde tentative affiche « déjà confirmée » ou réaffiche le code réellement en base.

**Résultat obtenu :** un **second code aléatoire, différent et jamais écrit en base**, est affiché dans le toast. Le Super Admin peut le copier/l'envoyer par WhatsApp ; le vendeur le saisira sur `/vendeur/creation-compte` et obtiendra « Le paiement n'a pas été confirmé » — indiscernable de BUG-A02, ce qui rendra le diagnostic très difficile.

**Même classe de défaut :** `rejectVendorApplication()` (même garde `.eq("status","pending")`, même silence), cf. BUG-A11.

**Correctif attendu :** `.update(...).eq(...).select("id")` puis vérifier que le tableau retourné n'est pas vide avant de renvoyer le code.

---

## BUG-A06 — Upload de justificatif : limite annoncée 15 Mo, limite réelle ~4,5 Mo, erreur brute

- **Sévérité :** HIGH
- **Module :** Portail vendeur — `/admin/store` → Documents justificatifs
- **Fichiers :** `src/components/admin/StoreForm.tsx` (l. 305-327 et l. 344), `src/app/api/documents/upload/route.ts` (l. 6, 38-40)

Trois limites incohérentes :
| Source | Limite |
|---|---|
| Texte affiché au vendeur (`StoreForm.tsx` l. 344) | **15 Mo** (héritage du chemin Cloudinary abandonné) |
| Validation applicative (`upload/route.ts` l. 6) | **5 Mo** |
| Limite réelle de la plateforme Vercel (body des fonctions serverless) | **~4,5 Mo** |

**Étapes de reproduction :**
1. Se connecter en vendeur, aller sur `/admin/store`.
2. Lire : « PDF ou photo, **15 Mo maximum** ».
3. Choisir un type de document et téléverser un PDF/JPG de **6 Mo** (taille très courante pour une pièce d'identité scannée ou une photo de smartphone).

**Résultat attendu :** message clair en français, soit acceptant le fichier (si 15 Mo est la règle), soit « Fichier trop volumineux (X Mo maximum) ».

**Résultat obtenu :** la requête est rejetée **par Vercel avant même d'atteindre la route**, avec un corps `text/plain`. Preuve (production, fichier 4,9 Mo, sans session — le 413 précède donc même le 401 d'authentification) :
```
HTTP 413
Request Entity Too Large
FUNCTION_PAYLOAD_TOO_LARGE
gru1::2xrql-1789314944684-4c81ddbef8d4
```
Côté client, `handleUpload` fait `await res.json()` (l. 316) sur ce corps texte → `SyntaxError` → attrapée l. 322 → le vendeur voit un toast contenant **le message d'erreur brut du parseur JavaScript, en anglais** (`Unexpected token 'R', "Request En"... is not valid JSON`).

**Impact :** la validation de boutique est bloquée pour tout vendeur dont le justificatif dépasse 4,5 Mo, avec un message incompréhensible. Aucune vérification de taille n'est faite côté client avant l'envoi.

**Correctif attendu :** (1) aligner le texte sur la limite réelle, (2) contrôler `file.size` dans le navigateur **avant** le `fetch`, (3) rendre `handleUpload` tolérant à une réponse non-JSON.

---

## BUG-A07 — Code d'accès généré avec `Math.random()`

- **Sévérité :** MEDIUM
- **Module :** Super Admin — Candidatures vendeur
- **Fichier :** `src/lib/db/vendorApplications.ts` (l. 40-46)

```ts
// No ambiguous chars (0/O, 1/I/L). 10 chars -> ~40 bits, unguessable.
const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
let out = "";
for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
```

**Problème :** `Math.random()` n'est pas un CSPRNG (xorshift128+ dans V8). L'entropie réelle n'est **pas** 40 bits : l'état du générateur est reconstructible à partir de quelques sorties observées, ce qui permet de prédire les codes suivants et précédents. Le code étant généré **dans le navigateur du Super Admin** (`candidatures/page.tsx` est `"use client"`), tous les codes d'une session proviennent du même flux PRNG.

**Scénario d'exploitation :** un attaquant dépose plusieurs candidatures, obtient légitimement ses propres codes confirmés dans la même session admin, puis prédit les codes émis aux autres candidats → création d'un compte vendeur avec le paiement d'autrui.

**Résultat attendu :** `crypto.getRandomValues(new Uint32Array(10))` (disponible côté navigateur comme côté Node) — ou mieux, génération côté serveur.

**Résultat obtenu :** PRNG non cryptographique, avec un commentaire affirmant à tort que le résultat est « unguessable ».

**Aggravant :** aucune limitation de débit sur `/api/vendeur/verifier-code` — 25 requêtes consécutives testées, **0 réponse 429** (cf. BUG-A08). L'endpoint est un oracle : il confirme la validité d'un code **et renvoie l'e-mail du payeur** (`{valid:true, email, planCode}`).

---

## BUG-A08 — Aucune limitation de débit sur les routes publiques à écriture

- **Sévérité :** MEDIUM
- **Module :** Transverse
- **Fichiers :** `src/app/api/inscription/route.ts`, `src/app/api/admin/register/route.ts`, `src/app/api/vendeur/verifier-code/route.ts`, `src/app/api/contact/route.ts`, `supabase/migrations/0008_vendor_applications.sql` (policy `vendor_applications_insert_public`)

**Étapes de reproduction (production, 2026-09-13) :**
```bash
for i in $(seq 1 25); do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://achavite.vercel.app/api/vendeur/verifier-code \
  -H "Content-Type: application/json" -d "{\"accessCode\":\"TEST$i\"}"; done
```

**Résultat attendu :** apparition de `429 Too Many Requests` au-delà d'un seuil raisonnable.

**Résultat obtenu :** `25 réponses non-429 / 0 réponse 429`. Idem sur `/api/inscription` (`15 non-429 / 0 429`).

**Surfaces exposées :**
- `/api/inscription` — création illimitée de comptes acheteurs via la clé service-role.
- `/api/admin/register` — idem, avec `role: vendor` (cf. BUG-A01).
- `vendor_applications` — insertion publique directe depuis le navigateur (policy `with check` ouverte à `anon`) : on peut noyer la page Candidatures du Super Admin sous des milliers de fausses déclarations de paiement.
- `/api/contact` — spam de la boîte `contactachavite@gmail.com` une fois le SMTP configuré (pas de captcha).

---

## BUG-A09 — Corps JSON malformé → HTTP 500 brut (9 routes / 9)

- **Sévérité :** MEDIUM
- **Module :** Transverse — API
- **Fichiers :** les 9 routes qui font `await request.json()` sans `try/catch` :
  `api/admin/register`, `api/contact`, `api/inscription`, `api/orders/lookup`, `api/orders/set-payment-method`, `api/send-digital-delivery`, `api/upload`, `api/vendeur/creer-compte`, `api/vendeur/verifier-code`.

**Étapes de reproduction :**
```bash
curl -i -X POST https://achavite.vercel.app/api/inscription \
  -H "Content-Type: application/json" -d 'xxx'
curl -i -X POST https://achavite.vercel.app/api/vendeur/verifier-code \
  -H "Content-Type: application/json" -d 'not-json'
curl -i -X POST https://achavite.vercel.app/api/contact \
  -H "Content-Type: application/json" -d 'xxx'
```

**Résultat attendu :** `400 Bad Request` avec `{"error":"Requête invalide."}`.

**Résultat obtenu :** `HTTP 500` avec un corps **vide**. Confirmé en production sur les 3 routes testées ; les 6 autres partagent le même motif de code.

**Impact :** statut HTTP faux, bruit dans les logs Vercel (une exception non gérée par requête malformée), et surface de déni de service applicatif triviale combinée à BUG-A08. `api/documents/upload` a le même défaut sur `await request.formData()`.

---

## BUG-A10 — « Votre boutique est active » alors qu'elle est en attente de validation

- **Sévérité :** MEDIUM
- **Module :** Portail vendeur — fin du tunnel d'inscription
- **Fichiers :** `src/app/vendeur/creation-compte/page.tsx` (l. 137-139), `src/app/api/vendeur/creer-compte/route.ts` (l. 119)

Le serveur crée la boutique avec `status: "pending"` :
```ts
.insert({ owner_id: userId, name: storeName, slug, phone, status: "pending" })
```
L'écran de confirmation affirme pourtant :
> « Compte vendeur créé — **Votre boutique est active.** Connectez-vous pour accéder à votre espace vendeur. »

**Étapes de reproduction :** terminer une création de compte vendeur (chemin gratuit `is_active=false`, ou chemin payant une fois BUG-A02 corrigé).

**Résultat attendu :** « Votre compte est créé. Votre boutique doit maintenant être validée par l'équipe AchaVite : ajoutez vos documents justificatifs depuis *Ma boutique*. »

**Résultat obtenu :** le vendeur croit sa boutique en ligne, publie des produits, et ne comprend pas pourquoi ils restent invisibles publiquement (le filtre `stores.status = 'approved'` de la RLS s'applique). Il n'est jamais invité à déposer ses justificatifs, ce qui bloque à son tour la validation (cf. BUG-A19).

---

## BUG-A11 — Mutations silencieusement sans effet (famille)

- **Sévérité :** MEDIUM
- **Module :** Super Admin — Monétisation
- **Fichiers :** `src/lib/db/subscriptionPlans.ts` (`updatePlan`), `src/lib/db/vendorApplications.ts` (`rejectVendorApplication`), `src/lib/db/paymentProviders.ts` (`setPaymentProviderActive`)

Tous suivent le motif `.update(patch).eq("id", …)` sans `.select()` → aucune erreur PostgREST quand 0 ligne est affectée (RLS refusée, garde de statut non satisfaite, id inexistant).

**Étapes de reproduction (cas le plus visible) :**
1. Super Admin → Monétisation → Plans.
2. Modifier le prix du plan `pro_monthly` et décocher/cocher « Actif ».
3. Simuler un refus RLS (compte dont `profiles.status` ≠ `active`, ou session expirée côté Postgres) puis « Enregistrer ».

**Résultat attendu :** toast d'erreur « Modification refusée ».

**Résultat obtenu :** toast **vert** « Offre "Mode Pro" mise à jour ». Aggravant : `PlanForm` est keyé par `plan.id`, donc le re-fetch déclenché par `setRefreshKey` **ne remonte pas le composant** — les valeurs saisies restent affichées et l'admin repart convaincu que le changement est en base. Comme `is_active` pilote désormais l'obligation de paiement, une bascule perdue signifie soit des vendeurs qui paient pour une offre censée être gratuite, soit l'inverse.

---

## BUG-A12 — Accessibilité : aucun label associé aux champs

- **Sévérité :** MEDIUM
- **Module :** Transverse — tous les formulaires des 3 portails
- **Fichiers :** l'ensemble de `src/app` et `src/components`

**Mesure (2026-09-13) :**
```
<input> dans src :          100
<label> dans src :           22
htmlFor= dans src :           0   ← aucun label n'est lié à un champ
aria-label sur champs/boutons: 9
```

**Étapes de reproduction :** parcourir `/inscription`, `/connexion`, `/checkout`, `/vendeur/paiement`, `/vendeur/creation-compte`, `/admin/store` avec NVDA ou VoiceOver, ou en navigation clavier pure.

**Résultat attendu :** chaque champ annonce son intitulé (WCAG 2.1 — 1.3.1 Info et relations, 3.3.2 Étiquettes ou instructions, 4.1.2 Nom/rôle/valeur).

**Résultat obtenu :** les champs ne portent qu'un `placeholder`. Le lecteur d'écran annonce « zone d'édition » sans intitulé, et l'intitulé **disparaît dès la première frappe** pour tous les utilisateurs (problème de mémoire à court terme, formulaires longs comme `/checkout` avec 6 champs). Les `<label>` présents n'enveloppent pas leur champ et n'ont pas de `htmlFor` : ils sont purement décoratifs.

---

## BUG-A13 — Format de téléphone imposé, avec un exemple erroné

- **Sévérité :** MEDIUM
- **Module :** Portail acheteur — inscription / connexion
- **Fichiers :** `src/app/api/inscription/route.ts` (l. 7, 30), `src/app/inscription/page.tsx` (l. 96), `src/app/connexion/page.tsx` (l. 74)

**Étapes de reproduction :**
1. `/inscription`, saisir « Amina », « 66 00 00 00 » (format local tchadien, celui que tout le monde dicte), mot de passe valide.
2. Soumettre.

**Résultat attendu :** le numéro local est normalisé vers E.164 avec l'indicatif du pays par défaut (+235), ou un sélecteur d'indicatif est proposé.

**Résultat obtenu (production) :**
```
HTTP 400 {"error":"Numéro invalide. Utilisez le format international, ex : +2356600000."}
```
Deux problèmes :
1. **L'exemple donné est lui-même un numéro invalide.** `+2356600000` = indicatif 235 + **7** chiffres. Un mobile tchadien a **8** chiffres (`+235 66 00 00 00`, soit `+23566000000`). Un utilisateur qui recopie le modèle crée un compte avec un numéro injoignable — or ce numéro est la **seule** identité du compte (BUG-A03) *et* le contact de livraison pré-rempli au checkout.
2. `normalizePhone()` ne conserve que `[\d+]`, sans ajouter d'indicatif : aucun format local n'est accepté, sur un marché où le format local est la norme.

**Effet de bord de connexion :** `/connexion` n'applique **aucune** validation, il recalcule seulement `syntheticEmailForPhone(phone)`. Un même utilisateur tapant `+23566000000` à l'inscription et `0023566000000` à la connexion obtient deux e-mails synthétiques différents → « Numéro ou mot de passe incorrect » sans explication.

---

## BUG-A14 — Checkout invité impossible

- **Sévérité :** MEDIUM
- **Module :** Portail acheteur — panier / checkout
- **Fichier :** `src/app/checkout/page.tsx` (l. 62-65)

```ts
if (!user) {
  setCustomer(null);
  router.push("/connexion?redirect=/checkout");
  return;
}
```

**Étapes de reproduction :**
1. Naviguer en anonyme, ajouter un produit au panier depuis `/catalogue`.
2. `/panier` → « Commander ».

**Résultat attendu :** cohérence avec le reste de l'application, qui promet explicitement un parcours sans compte — `/connexion` l. 106-112 : « Ou **suivez votre commande** sans compte », `/compte` l. 78-83 : « Suivre une commande sans compte », et `/api/orders/lookup` existe précisément pour les commandes invitées (`orders.customer_id` est nullable « for the pre-existing guest-tracking routes »).

**Résultat obtenu :** redirection immédiate vers `/connexion`. Le suivi invité survit mais **plus aucune commande invitée ne peut être créée** — la fonctionnalité est orpheline. À trancher produit : soit rétablir le checkout invité, soit retirer les mentions « sans compte ». En l'état, l'application se contredit, et sur ce marché l'obligation de créer un compte est un point de fuite majeur du tunnel d'achat.

---

## BUG-A15 — Soft-404 sur les fiches produit inexistantes

- **Sévérité :** LOW
- **Module :** Portail acheteur — SEO
- **Fichier :** `src/app/produit/[slug]/page.tsx` (l. 22-25)

Le composant serveur ne fait que déléguer à `ProductPageClient` ; `generateMetadata` détecte pourtant bien l'absence du produit (l. 10) mais **`notFound()` n'est jamais appelé**.

**Étapes de reproduction :**
```bash
curl -o /dev/null -w "%{http_code}\n" https://achavite.vercel.app/produit/inexistant-xyz
```

**Résultat attendu :** `404`.
**Résultat obtenu :** `200`, avec `<title>Produit introuvable | AchaVite</title>` dans le corps.

**Impact :** Google indexe une page d'erreur comme une page valide ; multiplié par le nombre de produits retirés du catalogue, cela génère du contenu dupliqué de faible qualité. `/categorie/<slug-inexistant>` renvoie correctement 404 — l'incohérence est donc interne.

---

## BUG-A16 — Fichier orphelin après suppression d'un justificatif

- **Sévérité :** LOW
- **Module :** Portail vendeur — documents
- **Fichiers :** `src/components/admin/StoreForm.tsx` (l. 329-337), `src/lib/db/storeDocuments.ts`

**Étapes de reproduction :** `/admin/store` → téléverser un justificatif → le supprimer via l'icône corbeille.

**Résultat attendu :** la ligne `store_documents` **et** l'objet du bucket privé `store-documents` sont supprimés.
**Résultat obtenu :** seule la ligne DB est supprimée (`deleteStoreDocument`) ; le fichier reste indéfiniment dans le bucket, désormais inaccessible via `/api/documents` (qui part de la ligne DB) donc invisible et non nettoyable depuis l'application. Accumulation de données personnelles (pièces d'identité) non purgeables — point de vigilance RGPD/protection des données.

---

## BUG-A17 — 6 prestataires sur 12 seulement dans Moyens de paiement

- **Sévérité :** LOW
- **Module :** Super Admin — Monétisation → Moyens de paiement
- **Fichiers :** `src/app/super-admin/monetisation/moyens-de-paiement/page.tsx` (l. 16-23), `supabase/migrations/0006_seller_payment_center.sql` (l. 86-108)

La base et le type TS connaissent **12** prestataires (`manual, wave, orange_money, mtn_momo, moov_money, airtel_money, free_money, tmoney, flooz, bank_transfer, card, qr`) et le centre de paiement vendeur les gère tous. `PROVIDER_OPTIONS` de la page Super Admin n'en propose que **6**.

**Étapes de reproduction :** Super Admin → Monétisation → Moyens de paiement → ouvrir la liste « Prestataire ».
**Résultat attendu :** les 12 prestataires, filtrés par le pays sélectionné (comme côté vendeur).
**Résultat obtenu :** 6 entrées. Impossible de déclarer le compte de réception d'AchaVite sur TMoney (Togo), Flooz (Bénin/Togo), Free Money (Sénégal), Virement bancaire, Carte ou QR. Contournement possible via « Autre / virement bancaire » (`manual`), mais le libellé et le filtrage par pays sont alors perdus sur `/vendeur/paiement`.

---

## BUG-A18 — HTML échappé dans les objets d'e-mail

- **Sévérité :** LOW
- **Module :** Transverse — e-mails
- **Fichiers :** `src/app/api/contact/route.ts` (l. 36, 42), `src/app/api/send-digital-delivery/route.ts` (l. 59, 68)

```ts
const safeName = escapeHtml(name);
...
subject: `Nouveau message de contact — ${safeName}`,
```
Un objet d'e-mail est du texte brut : l'échappement HTML y est visible tel quel.

**Étapes de reproduction :** envoyer le formulaire `/contact` avec le nom « Jean D'Arc » (apostrophe très fréquente en français) ou « N'Djamena Services ».
**Résultat attendu :** objet `Nouveau message de contact — Jean D'Arc`.
**Résultat obtenu :** objet `Nouveau message de contact — Jean D&#39;Arc`. Idem pour `orderCode`/`customerName` dans la livraison numérique (« Merci Jean D&#39;Arc 🎉 » figure d'ailleurs dans le corps via `firstName`, dérivé de la chaîne **déjà échappée**).

---

## BUG-A19 — Dossier boutique quasi vide pour tout vendeur issu du tunnel payant

- **Sévérité :** LOW (process)
- **Module :** Super Admin — Boutiques → dossier
- **Fichiers :** `src/app/api/vendeur/creer-compte/route.ts` (l. 119), `src/app/super-admin/stores/[id]/page.tsx`

La boutique est créée avec **seulement** `owner_id, name, slug, phone, status`. Le dossier de validation affiche donc systématiquement « — » pour WhatsApp, Ville, Adresse, Horaires, Description, et le bandeau jaune « Aucun document fourni par le vendeur ».

**Résultat attendu :** le tunnel collecte au minimum la ville et la catégorie, ou l'écran final oriente explicitement le vendeur vers *Ma boutique* pour compléter son dossier + déposer ses justificatifs.
**Résultat obtenu :** le Super Admin n'a rien à examiner ; combiné à BUG-A10 (« Votre boutique est active »), le vendeur n'est jamais informé qu'il doit compléter quoi que ce soit → blocage mutuel.

---

## BUG-A20 — Montant et plan de la candidature déclarés par le visiteur

- **Sévérité :** LOW
- **Module :** Portail vendeur — déclaration de paiement
- **Fichiers :** `src/lib/db/vendorApplications.ts` (l. 14-27), `supabase/migrations/0008_vendor_applications.sql` (policy `vendor_applications_insert_public`)

L'insertion se fait **directement depuis le navigateur** avec la clé `anon`. La policy `with check` contrôle bien `status`, `access_code`, `store_id`, `confirmed_by`, `consumed_at`, mais **pas** `amount`, `currency_code` ni `plan_code`.

**Étapes de reproduction :** depuis la console du navigateur sur `/vendeur/paiement`, insérer une ligne avec `amount: 100` et `plan_code: 'pro_monthly'`.
**Résultat attendu :** le montant et la devise sont recalculés côté serveur depuis `subscription_plans` (un trigger `BEFORE INSERT` existe déjà pour `subscription_payments` — même approche à appliquer ici).
**Résultat obtenu :** la candidature s'affiche au Super Admin avec le montant choisi par le candidat. Le contrôle repose entièrement sur le fait que l'admin vérifie le versement réel — mais l'écran l'invite justement à valider « le paiement de {montant} », ce qui l'ancre sur une valeur falsifiable. `plan_code` n'est pas non plus restreint à `('trial','pro_monthly')` côté base.

---

## BUG-A21 — Message d'erreur Supabase brut renvoyé au client

- **Sévérité :** LOW
- **Module :** API
- **Fichier :** `src/app/api/admin/register/route.ts` (l. 32)

```ts
if (error) return NextResponse.json({ error: error.message }, { status: 400 });
```
Contrairement à `/api/inscription` et `/api/vendeur/creer-compte` qui normalisent le message, cette route relaie le texte GoTrue tel quel (langue anglaise, détails d'implémentation, énumération de comptes existants). Disparaît avec la suppression de la route (BUG-A01).

---

## Non-bugs vérifiés (contrôles passés)

Ces points étaient explicitement à tester et **n'ont révélé aucun défaut** :

- **E-mail synthétique jamais exposé.** `isSyntheticEmail()` est appliqué aux deux seuls endroits où `user.email` atteint l'UI acheteur : `/compte` l. 33 et `/checkout` l. 76. Le champ e-mail du checkout reste bien **vide** pour un compte créé par téléphone. `profiles.name/phone` est alimenté par le trigger `handle_new_user()` à partir de `user_metadata`, donc `/compte` affiche bien le nom et le numéro (et non une chaîne vide).
- **Récursion RLS `orders`/`order_items` corrigée en production.** `/boutique` renvoie 18 occurrences de prix, `/produit/test`, `/produit/service-de-livraison` et `/categorie/mode` rendent leur `<title>` depuis la base. Aucune trace de « infinite recursion » nulle part.
- **Contournement du tunnel payant par appel direct à l'API : bloqué.** `POST /api/vendeur/creer-compte` sans `accessCode` → **403** pour `trial` **et** pour `pro_monthly` ; `planCode` fantaisiste → **400 « Offre invalide. »**. Aucun compte n'a été créé par ces tentatives. (La faille réelle passe par une **autre** route, cf. BUG-A01.)
- **Dégradation propre du mailer.** `POST /api/contact` complet → **503** `{"error":"L'envoi d'e-mails n'est pas encore configuré. Contactez-nous directement par WhatsApp."}` — message clair, pas de 500. `GMAIL_USER`/`GMAIL_APP_PASSWORD` ne sont donc effectivement pas configurés sur Vercel. `sendReminderEmail()` du cron est en `try/catch` et ne casse jamais la tâche.
- **Autorisation des documents.** `/api/documents?id=…` → 400 sans id, **401** sans session ; `/api/documents/upload` → **401** sans session, 405 en GET. Le contrôle « propriétaire de la boutique ou super_admin » est correctement implémenté des deux côtés.
- **Gardes de routes.** `/admin`, `/admin/abonnement`, `/admin/parametres/paiement`, `/super-admin`, `/super-admin/monetisation/candidatures` → **307** vers `/admin/connexion` sans session. `/admin/inscription` → 307 vers `/vendeur/offres`.
- **`/api/cron/subscription-reminders`** → **401** `{"error":"Unauthorized"}` sans `CRON_SECRET`.
- **`/api/orders/lookup`** : `AV-%` / `%` rejeté (**400**, regex `^AV-[0-9A-F]{8}$`) — l'énumération par jokers ILIKE signalée dans un audit précédent est bien fermée. Code inexistant → 404 générique.
- **`/api/orders/set-payment-method`** : méthode hors liste blanche → 400 ; `orderId` non-UUID → 404 ; exige bien le téléphone en plus de l'id.
- **En-têtes de sécurité** présents et corrects : `Content-Security-Policy` (avec `frame-ancestors 'none'`, `object-src 'none'`), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Aucune erreur « column not found in schema cache »** rencontrée. `/super-admin/stores/[id]` utilise `select("*")`, immunisé par construction.

---

## Points à vérifier en base (non testables sans accès)

Ces éléments n'ont pas pu être confirmés et méritent une vérification par `developer` :

1. **Migration 0009 (`create event trigger`)** — sur Supabase hébergé, le rôle `postgres` n'est pas superutilisateur et `CREATE EVENT TRIGGER` échoue généralement avec `42501 permission denied`. Si 0009 n'est pas réellement passée, le problème de cache de schéma **n'est pas** résolu et ressurgira à la prochaine migration. À confirmer par `select evtname from pg_event_trigger where evtname like 'pgrst%';`.
2. **Migration 0013 non observable depuis l'extérieur** — les deux plans étant `is_active = true` en production, le chemin « offre gratuite » (`is_active = false` → lecture publique du plan → `/vendeur/creation-compte?offre=…`) n'a pas pu être exercé. À tester en bascule contrôlée après correction de BUG-A02.
