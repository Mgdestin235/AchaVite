"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || password.length < 4) {
      toast.error("Merci de renseigner tous les champs (mot de passe : 4 caractères min).");
      return;
    }
    const res = register({ name: name.trim(), phone: phone.trim(), password });
    if (!res.ok) {
      toast.error(res.error ?? "Inscription impossible");
      return;
    }
    toast.success("Compte créé avec succès");
    router.push("/compte");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Créer un compte</h1>
      <p className="mb-6 text-sm text-gray-500">
        Facultatif, mais pratique pour retrouver vos commandes plus vite.
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
          Créer mon compte
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
