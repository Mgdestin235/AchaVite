"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isVendor = searchParams.get("portal") === "admin";
  const loginHref = isVendor ? "/admin/connexion" : "/connexion";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    if (isVendor) return;
    let cancelled = false;
    supabase
      .from("platform_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setWhatsappNumber(data?.whatsapp_number ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [isVendor, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const redirectTo = `${window.location.origin}/reinitialiser-mot-de-passe${isVendor ? "?portal=admin" : ""}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    // Never reveal whether the address has an account. Only surface a
    // genuine transport/rate-limit problem.
    if (resetError && /rate|too many|limit/i.test(resetError.message)) {
      setError("Trop de tentatives. Réessayez dans quelques minutes.");
      return;
    }
    setSent(true);
  }

  // Buyer accounts sign up with a phone number, not an email -- there's no
  // address to send a reset link to. Point them to WhatsApp support instead
  // of showing a form that can never work for them.
  if (!isVendor) {
    const waDigits = whatsappNumber ? normalizePhoneForWhatsApp(whatsappNumber) : "";
    const waLink = waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent("Bonjour, j'ai oublié le mot de passe de mon compte acheteur AchaVite.")}`
      : null;
    return (
      <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
        <h1 className="mb-1 text-xl font-bold text-navy">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-gray-500">
          Les comptes acheteur utilisent un numéro de téléphone, pas d&apos;email : la réinitialisation
          automatique n&apos;est pas encore disponible. Contactez-nous sur WhatsApp avec votre numéro
          de téléphone, nous vous aiderons à récupérer votre compte.
        </p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
          >
            <MessageCircle size={16} />
            Contacter le support WhatsApp
          </a>
        ) : (
          <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
            Le support WhatsApp n&apos;est pas encore configuré. Réessayez plus tard.
          </p>
        )}
        <p className="mt-5 text-center text-sm text-gray-500">
          <Link href={loginHref} className="font-semibold text-navy">
            Retour à la connexion
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-gray-500">
        Entrez votre email : nous vous enverrons un lien pour définir un nouveau mot de passe.
      </p>

      {sent ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          Si un compte existe pour <strong className="break-all">{email}</strong>, un lien de
          réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos spams.
          <Link href={loginHref} className="mt-3 block font-semibold text-navy underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link href={loginHref} className="font-semibold text-navy">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
