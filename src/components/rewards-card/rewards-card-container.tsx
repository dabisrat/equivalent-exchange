import { headers } from "next/headers";
import RewardsCard from "./rewards-card";
import { toString, toDataURL } from "qrcode";
import {
  getRewardsCard,
  updateRewardPoints,
} from "@PNN/utils/data-access/data-acess";
import Image from "next/image";

export default async function RewardsCardContainer({
  cardId,
}: {
  cardId: string;
}) {
  const h = headers();
  const card = await getRewardsCard(cardId);
  const qrCode = await toDataURL(
    `${h.get("host")}/${card.organization_id}/${card.id}`,
    {
      type: "image/webp",
    }
  );
  return (
    <>
      <RewardsCard card={card} updatePoints={updateRewardPoints}>
        <Image src={qrCode} alt="card-url-code" width="100" height="100" />
      </RewardsCard>
    </>
  );
}
