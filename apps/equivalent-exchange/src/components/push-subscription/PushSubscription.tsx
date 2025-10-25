"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "../../data-access/actions/subscribe-push";
import { useOrganization } from "../../contexts/organization-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import {
  checkBrowserSupport,
  getLocalSubscription,
  urlBase64ToUint8Array,
} from "./utils";

export default function PushSubscription() {
  const { organization } = useOrganization();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check subscription status on mount (for UI display only)
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!checkBrowserSupport() || !organization?.id) return;

      const subscription = await getLocalSubscription();
      setIsSubscribed(!!subscription);
    };

    if (organization?.id) {
      checkSubscriptionStatus();
    }
  }, [organization?.id]);

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

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Check if organization exists
      if (!organization?.id) {
        throw new Error("No organization ID found");
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permissions need to be unblocked");
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

      setIsSubscribed(true);
      toast.success("Subscribed to push notifications!");
    } catch (error) {
      console.error("Subscription failed:", error);
      toast.error(
        `Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`
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
