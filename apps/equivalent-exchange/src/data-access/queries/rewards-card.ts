import "server-only";
import { createClient as createServerClient } from "@eq-ex/shared/server";

export async function getRewardsCard(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("reward_card")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getUsersRewardsCards(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("reward_card")
    .select("*")
    .eq("user_id", id);

  if (error) {
    throw error;
  }
  return data;
}

export async function getStamps(cardId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("stamp")
    .select("*")
    .eq("reward_card_id", cardId);

  if (error) {
    throw error;
  }

  return data;
}
