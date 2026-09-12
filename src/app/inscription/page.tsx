"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { GOOGLE_AUTH_ENABLED, syntheticEmailForPhone } from "@/lib/buyerAuth";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirect = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Impossible de créer le compte. Réessayez.");
        return;
      }

      // Account created pre-confirmed server-side -- sign in immediately
      // so the buyer lands with a real session, no extra step.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: syntheticEmailForPhone(phone),
        password,
      });
      if (signInError) {
        toast.success("Compte créé ! Connectez-vous.");
        router.push("/connexion");
        return;
      }

      toast.success("Compte créé avec succès");
      router.push(redirect || "/boutique");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Créer un compte</h1>
      <p className="mb-6 text-sm text-gray-500">
        Nécessaire pour commander sur AchaVite et suivre vos achats.
      </p>

      {GOOGLE_AUTH_ENABLED && (
        <>
          <GoogleSignInButton redirect={redirect} />
          <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            ou
            <span className="h-px flex-1 bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom complet"
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numéro de téléphone (ex : +2356600000)"
          type="tel"
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe (8 caractères min)"
          type="password"
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-orange">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
