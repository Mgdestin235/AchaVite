"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MfaEnroll } from "@/components/admin/MfaEnroll";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"password" | "otp" | "mfa-setup">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        setStep("otp");
        return;
      }
      if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal2") {
        router.push("/admin");
        return;
      }
      // No MFA factor enrolled yet (shouldn't normally happen): enforce it now.
      setStep("mfa-setup");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !factors?.totp?.[0]) {
        setError("Aucun facteur 2FA trouvé pour ce compte.");
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factors.totp[0].id,
        code: code.trim(),
      });
      if (verifyError) {
        setError("Code incorrect. Réessayez.");
        return;
      }
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  if (step === "mfa-setup") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <MfaEnroll onDone={() => router.push("/admin")} />
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <form onSubmit={handleOtpSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <div className="mb-4 text-center">
            <p className="text-sm font-bold text-navy">Vérification en deux étapes</p>
            <p className="mt-1 text-xs text-gray-500">
              Entrez le code généré par votre application d&apos;authentification.
            </p>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg tracking-widest outline-none focus:border-orange"
          />
          {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
          <button
            disabled={loading || code.trim().length !== 6}
            className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Vérifier"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-12 w-auto" />
          <p className="text-sm font-bold text-navy">Espace administrateur</p>
        </div>
        <div className="space-y-3">
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
            placeholder="Mot de passe"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/admin/inscription" className="font-semibold text-orange">
            Créer un compte administrateur
          </Link>
        </p>
      </form>
    </div>
  );
}
