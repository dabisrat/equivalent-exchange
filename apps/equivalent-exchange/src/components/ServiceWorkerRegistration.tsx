"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".localhost") ||
      window.location.hostname === "127.0.0.1";

    if (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      (window.location.protocol === "https:" || isLocalhost)
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          if (registration.installing) {
            registration.installing.addEventListener("statechange", (e) => {
              console.log("State changed:", (e.target as ServiceWorker).state);
            });
          }
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    } else {
      console.warn("⚠️ Service Worker conditions not met");
    }
  }, []);

  return null; // This component doesn't render anything
}
