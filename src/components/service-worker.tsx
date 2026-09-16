"use client";

import { useEffect } from "react";

/** Registreert de service worker zodat de app installeerbaar is (PWA). */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registratie mislukt (bv. onbeveiligde herkomst) — de app werkt gewoon.
    });
  }, []);

  return null;
}
