"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MfaEnroll({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa
      .enroll({ factorType: "totp", friendlyName: "AchaVite Admin" })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setQrCode(`data:image/svg+xml;utf-8,${encodeURIComponent(data.totp.qr_code)}`);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {!qrCode ? (
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
        </form>
      )}
    </div>
  );
}
