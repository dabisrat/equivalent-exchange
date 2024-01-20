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

  return data?.user;
}

export async function signOut() {
  await createClient(cookies()).auth.signOut();
  return redirect("/auth");
}

// -----------------------------------------------------------------------------------------------------
export async function getRewardsCard(id: string) {
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .select()
    .eq("user_id", id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateRewardPoints(cardId: number, points: number) {
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .update({ points: points })
    .eq("id", cardId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  revalidatePath("/");
  return data;
}

export async function createRewardCard(userId: string, orgId: number) {
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .insert({ user_id: userId, points: 0, organization_id: orgId })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/");
  return data;
}
