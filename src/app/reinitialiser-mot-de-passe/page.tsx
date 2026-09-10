"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isVendor = searchParams.get("portal") === "admin";
  const loginHref = isVendor ? "/admin/connexion" : "/connexion";

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // supabase-js reads the recovery token from the URL hash on load and
    // fires PASSWORD_RECOVERY once the temporary session is in place.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setChecking(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy">Nouveau mot de passe</h1>

      {done ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          Votre mot de passe a été mis à jour.
          <Link href={loginHref} className="mt-3 block font-semibold text-navy underline">
            Se connecter
          </Link>
        </div>
      ) : checking ? (
        <p className="py-8 text-center text-sm text-gray-400">Vérification du lien...</p>
      ) : !hasSession ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.
          <Link
            href={`/mot-de-passe-oublie${isVendor ? "?portal=admin" : ""}`}
            className="mt-3 block font-semibold text-navy underline"
          >
            Renvoyer un lien
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              type="password"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
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
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
