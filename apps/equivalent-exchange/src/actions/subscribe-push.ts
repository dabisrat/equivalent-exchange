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
    .single();

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

export async function unsubscribeFromPush() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;

  return { success: true };
}
