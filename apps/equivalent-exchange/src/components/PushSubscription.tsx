"use client";

import { useState, useEffect } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "../actions/subscribe-push";
import { useOrganization } from "../contexts/organization-context";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscription() {
  const { organization } = useOrganization();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already subscribed on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
    };
    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Check if organization exists
      if (!organization?.id) {
        console.error("No organization ID found");
        setLoading(false);
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLoading(false);
        return;
      }

      // Get service worker registration
      // Add timeout to detect if service worker is stuck
      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Service worker registration timeout - PWA may be disabled"
              )
            ),
          5000
        )
      );

      const registration = (await Promise.race([
        registrationPromise,
        timeoutPromise,
      ])) as ServiceWorkerRegistration;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Call Server Action
      const result = await subscribeToPush({
        subscription: subscription.toJSON(),
        organizationId: organization.id,
      });

      setIsSubscribed(true);
      alert("Subscribed to push notifications!");
    } catch (error) {
      console.error("Subscription failed:", error);
      alert(
        `Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);

    if (!organization?.id) {
      console.error("No organization ID found");
      setLoading(false);
      return;
    }
    try {
      // Unsubscribe from push manager first
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Then remove from database
      await unsubscribeFromPush(organization.id);
      setIsSubscribed(false);
      alert("Unsubscribed from push notifications!");
    } catch (error) {
      console.error("Unsubscription failed:", error);
      alert("Failed to unsubscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {!isSubscribed ? (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Subscribing..." : "Subscribe to Notifications"}
        </button>
      ) : (
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Unsubscribing..." : "Unsubscribe from Notifications"}
        </button>
      )}
    </div>
  );
}
