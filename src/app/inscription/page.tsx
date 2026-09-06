"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Merci de renseigner votre nom et votre téléphone.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), phone: phone.trim(), role: "customer" } },
      });
      if (signUpError) {
        setError(
          signUpError.message === "User already registered"
            ? "Un compte existe déjà avec cet email."
            : signUpError.message
        );
        return;
      }

      if (!data.session) {
        // Email confirmation is required on this project — sign in won't
        // work until the user clicks the link Supabase just emailed them.
        toast.success("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
        router.push("/connexion");
        return;
      }

      toast.success("Compte créé avec succès");
      router.push(searchParams.get("redirect") || "/boutique");
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom complet"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numéro de téléphone"
          type="tel"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
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
