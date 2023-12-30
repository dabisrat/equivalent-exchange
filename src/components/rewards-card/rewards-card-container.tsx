import { createClient } from "@PNN/utils/supabase/server";
import RewardsCard from "./rewards-card";
import { cookies } from "next/headers";

export default async function RewardsCardContainer() {
  const client = createClient(cookies());
  const {
    data: { points },
    error,
  } = await client.from("reward_card").select("*").single();
  return <RewardsCard points={points} />;
}
