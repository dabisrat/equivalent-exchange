import { headers } from "next/headers";
import RewardsCard from "./rewards-card";
import { toString, toDataURL } from "qrcode";
import {
  createRewardCard,
  getRewardsCard,
  getUser,
  updateRewardPoints,
} from "@PNN/utils/data-access/data-acess";
import Image from "next/image";

export default async function RewardsCardContainer() {
  const h = headers();

  const user = await getUser();
  const card = await getRewardsCard(user!.id).catch((err) => {
    console.log("creating new card");
    // TODO: need to get the correct organization oid
    return createRewardCard(user!.id, 1);
  });
  const qrCode = await toDataURL(`${h.get("host")}/${card?.user_id}`, {
    type: "image/webp",
  });
  return (
    <>
      <RewardsCard card={card} updatePoints={updateRewardPoints}>
        <Image src={qrCode} alt="card-url-code" width="148" height="148" />
      </RewardsCard>
    </>
  );
}
