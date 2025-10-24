"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  subscribeToPush,
  unsubscribeFromPush,
  checkSubscriptionValidity,
} from "../data-access/actions/subscribe-push";
import { useOrganization } from "../contexts/organization-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";

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
  const [needsManualResub, setNeedsManualResub] = useState(false);

  // Check if already subscribed on mount
  useEffect(() => {
    const initializeSubscriptionStatus = async () => {
      if (!checkBrowserSupport()) return;

      const subscription = await getLocalSubscription();
      if (!subscription || !organization?.id) {
        setIsSubscribed(false);
        return;
      }

      await handleSubscriptionValidation(subscription);
    };

    if (organization?.id) {
      initializeSubscriptionStatus();
    }
  }, [organization?.id]);

  const checkBrowserSupport = () => {
    return "serviceWorker" in navigator && "PushManager" in window;
  };

  const getLocalSubscription = async (): Promise<PushSubscription | null> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error("Error getting local subscription:", error);
      return null;
    }
  };

  const handleSubscriptionValidation = async (
    subscription: PushSubscription
  ) => {
    try {
      const result = await checkSubscriptionValidity({
        endpoint: subscription.endpoint,
        organizationId: organization!.id,
      });

      if (result.isValid) {
        setIsSubscribed(true);
      } else {
        await attemptAutoResubscription();
      }
    } catch (error) {
      console.error("Error validating subscription:", error);
      setIsSubscribed(false);
    }
  };

  const attemptAutoResubscription = async () => {
    const resubSuccess = await resubscribeSilently();
    if (resubSuccess) {
      setIsSubscribed(true);
    } else {
      setNeedsManualResub(true);
    }
  };

  const performSubscribe = async (showAlerts = true) => {
    try {
      // Check if organization exists
      if (!organization?.id) {
        throw new Error("No organization ID found");
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get service worker registration
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
      await subscribeToPush({
        subscription: subscription.toJSON(),
        organizationId: organization.id,
      });

      return true;
    } catch (error) {
      console.error("Subscription failed:", error);
      if (showAlerts) {
        alert(
          `Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      return false;
    }
  };

  const resubscribeSilently = async () => {
    return await performSubscribe(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    const success = await performSubscribe(true);
    if (success) {
      setIsSubscribed(true);
      setNeedsManualResub(false);
      toast.success("Subscribed to push notifications!");
    }
    setLoading(false);
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

      if (!subscription) {
        toast.error("No active subscription found");
        setLoading(false);
        return;
      }

      const endpoint = subscription.endpoint;

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Then remove from database with endpoint
      await unsubscribeFromPush({
        organizationId: organization.id,
        endpoint: endpoint,
      });

      setIsSubscribed(false);
      toast.success("Unsubscribed from push notifications!");
    } catch (error) {
      console.error("Unsubscription failed:", error);
      toast.error(
        `Failed to unsubscribe: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Enable push notifications to stay updated with your
          organization&apos;s activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4">
          {needsManualResub && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              Your push notification subscription is stale. Please resubscribe
              manually.
            </div>
          )}
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
      </CardContent>
    </Card>
  );
}
