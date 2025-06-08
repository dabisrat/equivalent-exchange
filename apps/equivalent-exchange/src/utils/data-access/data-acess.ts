"use server";
import { cookies } from "next/headers";
import { createClient } from "../supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  const user = await getUser();
  const client = createClient(cookies());
  const { data, error } = await client
    .from("stamp")
    .update({ stamped: false, stamper_id: user.id })
    .eq("reward_card_id", cardId);

  if (error) {
    throw error;
  }

  const { data: d, error: e } = await client
    .from("reward_card")
    .update({ points: 0 })
    .eq("id", cardId);

  if (e) {
    throw e;
  }
  revalidatePath('/');
}

export async function addRewardPoints(card_id: string, stampIndex: number) {
  await updateStampById(card_id, stampIndex);

  let { data, error } = await createClient(cookies()).rpc("incrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }
  revalidatePath('/');
}

export async function removeRewardPoints(card_id: string, stampIndex: number) {
  await updateStampById(card_id, stampIndex);

  const { data, error } = await createClient(cookies()).rpc("decrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }

  revalidatePath('/');
}

async function updateStampById(cardId: string, stampIndex: number) {
  const client = await createClient(cookies());

  const card = await getRewardsCard(cardId);
  const maxCount = await getMaxCount(card.organization_id);

  // indexes less then 1 are invalid and caught by database constraints
  if (stampIndex > maxCount) {
    throw new Error("stamp index out of range");
  }

  const user = await getUser();
  const stamp = await getStamp(cardId, stampIndex);

  if (stamp) {
    await client
      .from("stamp")
      .update({ stamped: !stamp.stamped, stamper_id: user.id })
      .eq("stamp_index", stamp.stamp_index)
      .eq("reward_card_id", stamp.reward_card_id);
  } else {
    await client.from("stamp").insert([
      {
        reward_card_id: cardId,
        stamp_index: stampIndex,
        stamped: true,
      },
    ]);
  }
}

export async function createRewardCard(userId: string, orgId: string) {
  const org = await getOrganizationDetails(orgId).catch((e) => null);
  if (!org) {
    throw new Error("organization not found");
  }
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

async function getOrganizationDetails(orgId: string) {
  const { data, error } = await createClient(cookies())
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    console.log("error", error);
    throw error;
  }
  return data;
}

export async function canModifyCard(userId: string, orgId: string) {
  const { data, error } = await createClient(cookies())
    .from("stamper")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  return data?.organization_id === orgId;
}

export async function getStamps(cardId: string) {
  const { data, error } = await createClient(cookies())
    .from("stamp")
    .select("*")
    .eq("reward_card_id", cardId);

  if (error) {
    throw error;
  }

  return data;
}

async function getStamp(cardId: string, stampIndex: number) {
  const { data, error } = await createClient(cookies())
    .from("stamp")
    .select("*")
    .eq("reward_card_id", cardId)
    .eq("stamp_index", stampIndex)
    .single();

  if (error) {
    return null;
  }

  return data;
}
