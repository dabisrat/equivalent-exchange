"use server";
import { getUser } from "@eq-ex/auth";
import { createClient as createServerClient } from "@eq-ex/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getRewardsCard(id: string) {
  const { data, error } = await (await createServerClient())
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
  const { data, error } = await (await createServerClient())
    .from("reward_card")
    .select()
    .eq("user_id", id);

  if (error) {
    throw error;
  }
  return data;
}

export async function getRewardsCardId(orgId: string, userId: string) {
  const { data, error } = await (await createServerClient())
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
  const client = await createServerClient();
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

  let { data, error } = await (await createServerClient()).rpc("incrementpoints", {
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

  const { data, error } = await (await createServerClient()).rpc("decrementpoints", {
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
  const client = await (await createServerClient());

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

export async function createRewardCard(userId: string, organizationId: string) {
  const org = await getOrganizationDetails(organizationId).catch(() => null)

  if (!org) {
    throw new Error(`Organization with ID ${organizationId} not found`);
  }
  
  const client = await (await createServerClient());

  // First check if user already has a card for this organization
  const existingCard = await getRewardsCardId(organizationId, userId).catch(() => null);
  
  
  if (existingCard) {
    // User already has a card, redirect to it instead of creating a new one
    redirect(`/${organizationId}/${existingCard.id}`);
  }

  const { data, error } = await client
    .from("reward_card")
    .insert({
      user_id: userId,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating reward card:", error);
    throw error;
  }

  redirect(`/${organizationId}/${data.id}`);
}

export async function getMaxCount(orgId: string) {
  const { data, error } = await (await createServerClient(true))
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
  const { data, error } = await (await createServerClient(true))
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    console.error("error", error);
    throw error;
  }
  return data;
}

export async function canModifyCard(userId: string, orgId: string) {
  const { data, error } = await (await createServerClient())
    .from("organization_members")
    .select("organization_id, role, is_active")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  return data?.organization_id === orgId && data?.is_active === true;
}

// Add new function for role checking
export async function getOrganizationMemberRole(userId: string, orgId: string) {
  const { data, error } = await (await createServerClient())
    .from("organization_members")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  if (error || !data?.is_active) return null;
  return data.role;
}

// Add function to check if user is organization member
export async function isOrganizationMember(userId: string, orgId: string) {
  const { data, error } = await (await createServerClient())
    .from("organization_members")
    .select("is_active")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  return data?.is_active === true;
}

export async function getStamps(cardId: string) {
  const { data, error } = await (await createServerClient())
    .from("stamp")
    .select("*")
    .eq("reward_card_id", cardId);

  if (error) {
    throw error;
  }

  return data;
}

async function getStamp(cardId: string, stampIndex: number) {
  const { data, error } = await (await createServerClient())
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
