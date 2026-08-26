// Minimal service worker: exists only so the site can be installed as an
// app. It intentionally does NOT intercept fetch requests — a caching
// strategy here previously served stale HTML in place of hashed CSS/JS
// chunks on flaky mobile networks, breaking all styling. Every request is
// left to the browser's normal network stack.
const CACHE_NAME = "achavite-cache-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
