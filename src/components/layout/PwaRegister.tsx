"use client";

import { useEffect } from "react";

// This site no longer uses a service worker: an earlier version of it
// cached responses aggressively and, on a flaky mobile connection, could
// serve stale HTML in place of a CSS/JS chunk -- stripping all styling
// for visitors stuck on that cached worker. PWA installability doesn't
// depend on one (confirmed via the native "Add to Home Screen" prompt),
// so instead of registering anything, actively unregister whatever old
// worker and caches a visitor's browser might still have.
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);
  return null;
}
