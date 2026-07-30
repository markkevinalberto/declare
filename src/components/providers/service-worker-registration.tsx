"use client";

import { useEffect } from "react";

/** Registers the installability service worker — silently no-ops on
 * browsers/contexts without support (e.g. dev over plain http on a LAN IP). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
