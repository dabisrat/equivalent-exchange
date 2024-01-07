import { createClient } from "@PNN/utils/supabase/server";
import RewardsCard from "./rewards-card";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import Loading from "@PNN/app/loading";

const updatePoints = async (points: number): Promise<number> => {
  "use server";
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .update({ points: points })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    throw error;
  }
  revalidatePath("");
  return data?.points;
};

export default async function RewardsCardContainer() {
  const client = createClient(cookies());
  const {
    data: { points },
    error,
  } = await client.from("reward_card").select("*").single();
  return <RewardsCard points={points} updatePoints={updatePoints} />;
}
