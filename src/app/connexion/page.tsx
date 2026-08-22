"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(phone.trim(), password);
    if (!res.ok) {
      toast.error(res.error ?? "Connexion impossible");
      return;
    }
    toast.success("Connexion réussie");
    router.push("/compte");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Se connecter</h1>
      <p className="mb-6 text-sm text-gray-500">
        Retrouvez vos commandes et vos informations en un instant.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numéro de téléphone"
          type="tel"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          type="password"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-orange">
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
