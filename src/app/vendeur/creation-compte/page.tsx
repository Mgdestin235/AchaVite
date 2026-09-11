"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FAILURE_MSG =
  "Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer.";

export default function CreateVendorAccountPage() {
  return (
    <Suspense>
      <CreateVendorAccountForm />
    </Suspense>
  );
}

function CreateVendorAccountForm() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const offre = searchParams.get("offre"); // "free" | "pro" | null (null = code flow)
  const planCode = offre === "pro" ? "pro_monthly" : "trial";

  // "?offre=..." mode: check live (server-truth, via public RLS) whether
  // this plan currently requires payment. Never trust the query string
  // alone -- /api/vendeur/creer-compte re-verifies this itself.
  const [checkingOffre, setCheckingOffre] = useState(Boolean(offre));
  const [freeModeAllowed, setFreeModeAllowed] = useState(false);

  useEffect(() => {
    if (!offre) return;
    let cancelled = false;
    supabase
      .from("subscription_plans")
      .select("is_active")
      .eq("code", planCode)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setFreeModeAllowed(data ? !data.is_active : false);
        setCheckingOffre(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offre, planCode]);

  // Code-flow state (no ?offre -- unlocked via a Super Admin-confirmed access code).
  const [accessCode, setAccessCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState("");
  const [codeError, setCodeError] = useState("");

  // Account form state (shared by both flows).
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [storeName, setStoreName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/vendeur/verifier-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      const data = (await res.json()) as { valid?: boolean; email?: string; planCode?: string };
      if (!data.valid) {
        setCodeError(FAILURE_MSG);
        return;
      }
      setLockedEmail(data.email ?? "");
      setUnlocked(true);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendeur/creer-compte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          accessCode: unlocked ? accessCode : undefined,
          email: unlocked ? lockedEmail : email,
          password,
          firstName,
          lastName,
          phone,
          storeName,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || FAILURE_MSG);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <CheckCircle2 size={32} className="mb-3 text-green-600" />
          <h1 className="text-lg font-bold text-navy">Compte vendeur créé</h1>
          <p className="mt-2 text-sm text-gray-600">
            Votre boutique est active. Connectez-vous pour accéder à votre espace vendeur.
          </p>
          <button
            onClick={() => router.push("/admin/connexion")}
            className="mt-5 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const accountForm = (bannerText: string) => (
    <>
      <p className="mt-3 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">{bannerText}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Prénom"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Nom"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Numéro de téléphone"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        {unlocked ? (
          <input value={lockedEmail} readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 outline-none" />
        ) : (
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Votre adresse e-mail"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        )}
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
          placeholder="Mot de passe (8 caractères min.)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required
          placeholder="Confirmer le mot de passe"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required placeholder="Nom de la boutique"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}

        <button
          disabled={submitting}
          className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer mon compte vendeur"}
        </button>
      </form>
    </>
  );

  // ---- Free entry (?offre=free|pro, plan currently not payment-gated) ----
  if (offre) {
    if (checkingOffre) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
          <Loader2 size={28} className="mx-auto animate-spin text-navy" />
        </div>
      );
    }
    if (!freeModeAllowed) {
      // The offer requires payment (or doesn't exist) -- never show the
      // account form for it, regardless of what the URL claims.
      return (
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            <h1 className="text-lg font-bold text-navy">Cette offre nécessite un paiement</h1>
            <p className="mt-2 text-sm text-gray-600">
              Le mode {offre === "pro" ? "Pro" : "Free"} n&apos;est pas gratuit actuellement. Passez par
              l&apos;étape de paiement pour créer votre compte.
            </p>
            <Link
              href={`/vendeur/paiement?offre=${offre}`}
              className="mt-5 block rounded-xl bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
            >
              Aller au paiement
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <h1 className="text-xl font-bold text-navy">Créer mon compte vendeur</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mode {offre === "pro" ? "Pro" : "Free"} — offre actuellement gratuite, aucun paiement requis.
        </p>
        {accountForm("Ce mode est actuellement gratuit ! Vous pouvez créer votre compte vendeur directement.")}
      </div>
    );
  }

  // ---- Code entry (came from the payment declaration flow) ----
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-navy">Créer mon compte vendeur</h1>

      {!unlocked ? (
        <>
          <p className="mt-1 text-sm text-gray-500">
            Saisissez le code d&apos;accès reçu par WhatsApp après confirmation de votre paiement.
          </p>
          <form onSubmit={handleVerify} className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-navy">
              <KeyRound size={13} />
              Code d&apos;accès
            </label>
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
              placeholder="Ex : AB3K9MPQRS"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center font-mono text-sm tracking-widest outline-none focus:border-orange"
            />
            {codeError && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{codeError}</p>
            )}
            <button
              disabled={verifying}
              className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
            >
              {verifying ? "Vérification..." : "Vérifier mon paiement"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-400">
            Vous n&apos;avez pas encore payé ?{" "}
            <Link href="/vendeur/offres" className="font-semibold text-navy underline">
              Voir les offres
            </Link>
          </p>
        </>
      ) : (
        accountForm("Paiement confirmé ! Vous pouvez maintenant créer votre compte vendeur.")
      )}
    </div>
  );
}
