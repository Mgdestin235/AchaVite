"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";

export default function CreateVendorAccountPage() {
  const router = useRouter();

  const [accessCode, setAccessCode] = useState("");
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
        body: JSON.stringify({ accessCode, email, password, firstName, lastName, phone, storeName }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error ||
            "Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer."
        );
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
      <p className="mt-1 text-sm text-gray-500">
        Saisissez le code d&apos;accès reçu après confirmation de votre paiement.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="rounded-xl bg-navy/5 p-3">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-navy">
            <KeyRound size={13} />
            Code d&apos;accès
          </label>
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            required
            placeholder="Ex : AB3K9MPQRS"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-sm font-mono tracking-widest outline-none focus:border-orange"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Prénom"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Nom"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Numéro de téléphone"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
          placeholder="Adresse e-mail (celle du paiement)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange" />
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

      <p className="mt-4 text-center text-xs text-gray-400">
        Vous n&apos;avez pas encore payé ?{" "}
        <Link href="/vendeur/offres" className="font-semibold text-navy underline">
          Voir les offres
        </Link>
      </p>
    </div>
  );
}
