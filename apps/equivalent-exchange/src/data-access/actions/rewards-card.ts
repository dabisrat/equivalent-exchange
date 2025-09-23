"use server";
import { getUser } from "@eq-ex/auth";
import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";
import { redirect } from "next/navigation";
import { getRewardsCard } from "@app/data-access/queries/rewards-card";
import {
  canModifyCard,
  getMaxCount,
} from "@app/data-access/queries/organization";
import { getRewardsCardId } from "@app/utils/data-access";

// don't export this with out verifying the RSL policies on the rewards_card table
async function addRewardPoints(card_id: string) {
  const supabase = await createServerClient();
  let { data, error } = await supabase.rpc("incrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }
}

// don't export this with out verifying the RSL policies on the rewards_card table
async function removeRewardPoints(card_id: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("decrementpoints", {
    card_id,
  });

  if (data === null) {
    throw new Error("something went wrong!");
  }

  if (error) {
    throw error;
  }
}

//don't export this method!
async function getOrganizationDetails(orgId: string) {
  const { data, error } = await supabaseAdmin
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
// don't export this method!
async function getStamp(cardId: string, stampIndex: number) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
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

export async function redeemRewards(cardId: string) {
  const [user, card] = await Promise.all([getUser(), getRewardsCard(cardId)]);

  const canModify = await canModifyCard(user.id, card.organization_id);

  if (!canModify) {
    throw new Error("User does not have permission to modify this card");
  }

  const { data, error } = await supabaseAdmin
    .from("stamp")
    .update({ stamped: false, stamper_id: user.id })
    .eq("reward_card_id", cardId);

  if (error) {
    throw error;
  }

  const { data: d, error: e } = await supabaseAdmin
    .from("reward_card")
    .update({ points: 0 })
    .eq("id", cardId);

  if (e) {
    throw e;
  }
}

export async function updateStampById(cardId: string, stampIndex: number) {
  const card = await getRewardsCard(cardId);
  const maxCount = await getMaxCount(card.organization_id);

  if (stampIndex > maxCount) {
    throw new Error("stamp index out of range");
  }

  const user = await getUser();
  const canModify = await canModifyCard(user.id, card.organization_id);

  if (!canModify) {
    throw new Error("User does not have permission to modify this card");
  }

  const stamp = await getStamp(cardId, stampIndex);

  if (stamp) {
    await supabaseAdmin
      .from("stamp")
      .update({ stamped: !stamp.stamped, stamper_id: user.id })
      .eq("stamp_index", stamp.stamp_index)
      .eq("reward_card_id", stamp.reward_card_id);
    stamp.stamped ? removeRewardPoints(cardId) : addRewardPoints(cardId);
  } else {
    await supabaseAdmin.from("stamp").insert([
      {
        reward_card_id: cardId,
        stamp_index: stampIndex,
        stamped: true,
      },
    ]);
    addRewardPoints(cardId);
  }
}

export async function createRewardCard(userId: string, organizationId: string) {
  const org = await getOrganizationDetails(organizationId).catch(() => null);

  if (!org) {
    throw new Error(`Organization with ID ${organizationId} not found`);
  }

  const client = await createServerClient();

  // First check if user already has a card for this organization
  const existingCard = await getRewardsCardId(organizationId, userId).catch(
    () => null
  );

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
