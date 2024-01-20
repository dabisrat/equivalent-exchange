import RewardsCard from "./rewards-card";

import {
  createRewardCard,
  getRewardsCard,
  getUser,
  updateRewardPoints,
} from "@PNN/utils/data-access/data-acess";

export default async function RewardsCardContainer() {
  const user = await getUser();
  const card = await getRewardsCard(user!.id).catch((err) => {
    console.log("creating new card");
    // TODO: need to get the correct organization oid
    return createRewardCard(user!.id, 1);
  });

  return <RewardsCard card={card} updatePoints={updateRewardPoints} />;
}
