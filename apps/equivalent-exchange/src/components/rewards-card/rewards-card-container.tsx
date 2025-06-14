import { headers } from "next/headers";
import RewardsCard from "./rewards-card";
import { toDataURL } from "qrcode";
import {
  canModifyCard,
  getMaxCount,
  getRewardsCard,
} from "@eq-ex/app/utils/data-access/data-acess";
import Image from "next/image";
import { getUser } from '@eq-ex/auth';

export default async function RewardsCardContainer({
  cardId,
}: {
  cardId: string;
}) {
  const user = await getUser(); //TODO I should do this at the top level and pass the user
  const card = await getRewardsCard(cardId); //TODO I should do this at the top level and pass the card
  const maxPoints = await getMaxCount(card.organization_id); // same as above
  const canModify = await canModifyCard(user.id, card.organization_id); // same as above
  const url = `https://${(await headers()).get("host")}/${card.organization_id}/${card.id
    }`;
  const qrCode = await toDataURL(url, {
    type: "image/webp",
    color: { dark: "#000000FF", light: "#00000000" },
  });

  return (
    <>
      {user.id !== card.user_id && (
        <div className="flex justify-center">
          You are viewing another users card{" "}
        </div>
      )}
      <RewardsCard card={card} maxPoints={maxPoints} canModify={canModify}>
        <Image src={qrCode} alt="card-url-code" width="100" height="100" />
      </RewardsCard>
    </>
  );
}
