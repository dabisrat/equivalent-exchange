"use client";

import { useEffect } from "react";
import {
  subscribeToPush,
  checkSubscriptionValidity,
} from "../../data-access/actions/subscribe-push";
import { useOrganization } from "../../contexts/organization-context";
import { useAuth } from "@eq-ex/auth";
import {
  checkBrowserSupport,
  getLocalSubscription,
  urlBase64ToUint8Array,
} from "./utils";
import { toast } from "sonner";

export default function PushSubscriptionManager() {
  const { organization } = useOrganization();
  const { user } = useAuth();

  useEffect(() => {
    const initializeSubscriptionStatus = async () => {
      if (!checkBrowserSupport() || !organization?.id || !user?.id) return;
      const subscription = await getLocalSubscription();
      if (!subscription) return;

      await handleSubscriptionValidation(subscription);
    };

    const handleSubscriptionValidation = async (
      subscription: PushSubscription
    ) => {
      try {
        const result = await checkSubscriptionValidity({
          endpoint: subscription.endpoint,
          organizationId: organization!.id,
        });
        if (!result.isValid) {
          await attemptAutoResubscription();
        }
      } catch (error) {
        console.error("Error validating subscription:", error);
      }
    };

    const attemptAutoResubscription = async () => {
      const resubSuccess = await resubscribeSilently();
      if (!resubSuccess) {
        toast.warning(
          "Notifications are disabled. Please resubscribe in settings."
        );
      }
    };

    const resubscribeSilently = async () => {
      try {
        if (!organization?.id) return false;

        // Request permission (silently, no alerts)
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

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
        console.error("Silent resubscription failed:", error);
        return false;
      }
    };

    if (organization?.id) {
      initializeSubscriptionStatus();
    }
  }, [organization?.id, user?.id]);

  return null;
}
