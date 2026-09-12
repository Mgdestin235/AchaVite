"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { syntheticEmailForPhone } from "@/lib/buyerAuth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: syntheticEmailForPhone(phone),
        password,
      });
      if (signInError) {
        setError("Numéro ou mot de passe incorrect.");
        return;
      }
      toast.success("Connexion réussie");
      router.push(searchParams.get("redirect") || "/boutique");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const redirect = searchParams.get("redirect");

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Se connecter</h1>
      <p className="mb-6 text-sm text-gray-500">
        Retrouvez vos commandes et finalisez vos achats.
      </p>

      <GoogleSignInButton redirect={redirect} />

      <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        ou
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          placeholder="Mot de passe"
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
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link
          href={`/inscription${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-semibold text-orange"
        >
          Créer un compte
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Ou{" "}
        <Link href="/suivi" className="font-semibold text-navy">
          suivez votre commande
        </Link>{" "}
        sans compte.
      </p>
    </div>
  );
}
