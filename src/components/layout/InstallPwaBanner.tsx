"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPwaBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("achavite-install-dismissed") === "1"
  );

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    sessionStorage.setItem("achavite-install-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-16 left-3 right-3 z-50 flex items-center gap-3 rounded-2xl bg-navy p-3 shadow-2xl ring-1 ring-white/10 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange text-lg font-extrabold text-white">
        A
      </span>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-white">Installer AchaVite</p>
        <p className="text-xs text-white/70">Accédez à la boutique en un tap, comme une app.</p>
      </div>
      <button
        onClick={install}
        className="flex items-center gap-1 rounded-lg bg-orange px-3 py-2 text-xs font-bold text-white hover:bg-orange-dark"
      >
        <Download size={14} />
        Installer
      </button>
      <button onClick={dismiss} className="text-white/50 hover:text-white" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}
