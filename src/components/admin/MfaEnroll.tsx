"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MfaEnroll({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // A previous failed attempt (e.g. the broken-QR bug) can leave an
      // unverified factor behind; Supabase then refuses to enroll a new one
      // with the same friendly name, which used to fail silently here
      // (see loadError handling below). Clear any stale unverified factor
      // first so retrying always works.
      // supabase-js types `data.totp` as verified-only, but at runtime it
      // (like `data.all`) actually includes unverified factors too — filter
      // `all` ourselves to find a stale one without fighting that type.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const stale = existing?.all.find((f) => f.factor_type === "totp" && f.status === "unverified");
      if (stale) {
        await supabase.auth.mfa.unenroll({ factorId: stale.id });
      }
      if (cancelled) return;

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `AchaVite Admin ${Date.now()}`,
      });
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        return;
      }
      setLoadError("");
      setFactorId(data.id);
      setSecret(data.totp.secret);
      // supabase-js already returns a complete `data:image/svg+xml;utf-8,...`
      // URI here (not raw SVG markup) — wrapping it again produced a
      // nonsensical double-encoded data URI that silently failed to render.
      const qr = data.totp.qr_code;
      setQrCode(qr.startsWith("data:") ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`);
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setVerifying(false);
    if (error) {
      setError("Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.");
      return;
    }
    onDone();
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-black/5">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
          <ShieldCheck size={22} />
        </span>
        <p className="text-sm font-bold text-navy">Activer la double authentification</p>
        <p className="text-xs text-gray-500">
          Obligatoire pour tous les comptes admin. Scannez ce code avec Google Authenticator,
          Authy ou une app similaire.
        </p>
      </div>

      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <ShieldAlert size={28} className="text-red-500" />
          <p className="text-sm text-red-500">{loadError}</p>
          <button
            onClick={() => {
              setLoadError("");
              setQrCode(null);
              setAttempt((a) => a + 1);
            }}
            className="rounded-xl bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark"
          >
            Réessayer
          </button>
          <button onClick={onDone} className="text-xs font-medium text-gray-400 underline hover:text-gray-600">
            Continuer sans 2FA pour l&apos;instant
          </button>
        </div>
      ) : !qrCode ? (
        <div className="flex justify-center py-8">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      ) : (
        <form onSubmit={handleVerify}>
          <div className="mb-3 flex justify-center rounded-xl bg-white p-3 ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR code d'activation 2FA" width={180} height={180} />
          </div>
          <p className="mb-3 break-all rounded-lg bg-navy/5 px-3 py-2 text-center font-mono text-xs text-navy">
            {secret}
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg tracking-widest outline-none focus:border-orange"
          />
          {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
          <button
            disabled={verifying || code.trim().length !== 6}
            className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
          >
            {verifying ? "Vérification..." : "Activer le 2FA"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="mt-3 block w-full text-center text-xs font-medium text-gray-400 underline hover:text-gray-600"
          >
            Continuer sans 2FA pour l&apos;instant
          </button>
        </form>
      )}
    </div>
  );
}
