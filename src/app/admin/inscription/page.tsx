"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MfaEnroll } from "@/components/admin/MfaEnroll";

export const dynamic = "force-dynamic";

export default function AdminRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"form" | "mfa">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Inscription impossible.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      setStep("mfa");
    } finally {
      setLoading(false);
    }
  }

  if (step === "mfa") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <MfaEnroll
          onDone={() => {
            toast.success("Compte administrateur créé avec succès");
            router.push("/admin");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-12 w-auto" />
          <p className="text-sm font-bold text-navy">Créer un compte administrateur</p>
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="Mot de passe (8 caractères min)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            required
            placeholder="Confirmer le mot de passe"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            placeholder="Code d'invitation"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>

        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {loading ? "Création en cours..." : "Continuer"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          L&apos;étape suivante active la double authentification (2FA), obligatoire.
        </p>
        <p className="mt-3 text-center text-sm text-gray-500">
          Déjà un compte ?{" "}
          <Link href="/admin/connexion" className="font-semibold text-orange">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
