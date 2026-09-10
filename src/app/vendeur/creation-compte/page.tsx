"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";

const FAILURE_MSG =
  "Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer.";

export default function CreateVendorAccountPage() {
  const router = useRouter();

  // Step 1 -- unlock with the access code.
  const [accessCode, setAccessCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [lockedEmail, setLockedEmail] = useState("");
  const [codeError, setCodeError] = useState("");

  // Step 2 -- the account form.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
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
      const data = (await res.json()) as { valid?: boolean; email?: string };
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
          accessCode,
          email: lockedEmail,
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
        <>
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
            Paiement confirmé ! Vous pouvez maintenant créer votre compte vendeur.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Prénom"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Nom"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
            </div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Numéro de téléphone"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
            <input value={lockedEmail} readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 outline-none" />
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
      )}
    </div>
  );
}
