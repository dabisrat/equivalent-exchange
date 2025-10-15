"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker on HTTPS or localhost
    if (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost")
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}
