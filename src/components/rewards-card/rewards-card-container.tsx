import { headers } from "next/headers";
import RewardsCard from "./rewards-card";
import { toDataURL } from "qrcode";
import { getMaxCount, getRewardsCard } from "@PNN/utils/data-access/data-acess";
import Image from "next/image";

export default async function RewardsCardContainer({
  cardId,
}: {
  cardId: string;
}) {
  const h = headers();
  const card = await getRewardsCard(cardId); //TODO I should do this at the top level and pass the card
  const maxPoints = await getMaxCount(card.organization_id); // same as above
  const qrCode = await toDataURL(
    `${h.get("host")}/${card.organization_id}/${card.id}`,
    {
      type: "image/webp",
    }
  );
  return (
    <>
      <RewardsCard card={card} maxPoints={maxPoints}>
        <Image src={qrCode} alt="card-url-code" width="100" height="100" />
      </RewardsCard>
    </>
  );
}
