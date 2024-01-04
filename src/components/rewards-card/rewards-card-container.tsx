import { createClient } from "@PNN/utils/supabase/server";
import RewardsCard from "./rewards-card";
import { cookies } from "next/headers";

const updatePoints = async (points: number) => {
  "use server";
  console.log(points);
  const { data, error } = await createClient(cookies())
    .from("reward_card")
    .update({ points: points })
    .eq("id", 1)
    .select();

  if (error) {
    console.error(error);
  }
  console.log(data);
};

export default async function RewardsCardContainer() {
  const client = createClient(cookies());
  const {
    data: { points },
    error,
  } = await client.from("reward_card").select("*").single();
  return <RewardsCard points={points} updatePoints={updatePoints} />;
}
