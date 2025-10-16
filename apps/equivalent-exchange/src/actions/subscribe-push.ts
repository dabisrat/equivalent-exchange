"use server";

import { createClient } from "@eq-ex/shared/server";

export async function subscribeToPush({
  subscription,
  organizationId,
}: {
  subscription: any;
  organizationId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // Check if subscription already exists
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("subscription->>endpoint", subscription.endpoint)
    .maybeSingle();

  if (existing) {
    // Update existing subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ subscription })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Insert new subscription
    const { error } = await supabase.from("push_subscriptions").insert({
      user_id: user.id,
      organization_id: organizationId,
      subscription,
    });

    if (error) throw error;
  }

  return { success: true };
}

export async function unsubscribeFromPush(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // Get the current device's subscription endpoint
  const registration = await navigator.serviceWorker.ready;
  const currentSubscription = await registration.pushManager.getSubscription();

  if (!currentSubscription) {
    throw new Error("No active subscription found");
  }

  // Delete only THIS device's subscription
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("subscription->>endpoint", currentSubscription.endpoint);

  if (error) throw error;

  return { success: true };
}
