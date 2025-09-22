"use server";

import { createClient } from "@eq-ex/shared/server";

export async function getRewardsCardId(orgId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reward_card")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }
  return data;
}
