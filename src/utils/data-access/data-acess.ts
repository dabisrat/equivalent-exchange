"use server";
import { cookies } from "next/headers";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getUser() {
  const { data, error } = await createClient(cookies()).auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOut() {
  const { error } = await createClient(cookies()).auth.signOut();

  if (error) {
    console.error(error);
  }
  return redirect("/login");
}

// -----------------------------------------------------------------------------------------------------
export async function getRewardsCard(id: string) {
  const { data, error } = await createClient(cookies())
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
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .select()
    .eq("user_id", id);

  if (error) {
    throw error;
  }
  return data;
}

export async function getRewardsCardId(orgId: string, userId: string) {
  const { data, error } = await createClient(cookies())
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

export async function redeemRewards(cardId: string) {
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .update({ points: 0 })
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  revalidatePath("/");
  return data;
}

export async function addRewardPoints(card_id: string) {
  let { data, error } = await createClient(cookies()).rpc("incrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }
  revalidatePath("/");
  return data;
}

export async function removeRewardPoints(card_id: string) {
  const { data, error } = await createClient(cookies()).rpc("decrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }
  revalidatePath("/");
  return data;
}

export async function createRewardCard(userId: string, orgId: string) {
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .insert({ user_id: userId, points: 0, organization_id: orgId })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  redirect(`/${orgId}/${data.id}`);
}

export async function getMaxCount(orgId: string) {
  const { data, error } = await createClient(cookies())
    .from("organization")
    .select("max_points")
    .eq("id", orgId)
    .single();

  if (error) {
    throw error;
  }

  return data.max_points;
}
