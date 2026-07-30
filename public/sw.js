// Minimal service worker — its only job is to exist with a fetch handler,
// which is what makes the browser consider this app installable. No offline
// caching strategy; every request just passes through to the network.
self.addEventListener("fetch", () => {});
