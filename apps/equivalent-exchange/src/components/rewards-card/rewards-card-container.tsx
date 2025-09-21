import {
  canModifyCard,
  getMaxCount,
  getRewardsCard,
  getStamps,
} from "@app/utils/data-access";
import { getUser } from "@eq-ex/auth";
import { headers } from "next/headers";
import Image from "next/image";
import { toDataURL } from "qrcode";
import RewardsCard from "./rewards-card";
import type { User } from "@supabase/supabase-js";

export default async function RewardsCardContainer({
  cardId,
  user,
}: {
  cardId: string;
  user: User;
}) {
  const [card, stamps, headerData] = await Promise.all([
    getRewardsCard(cardId),
    getStamps(cardId),
    headers(),
  ]);

  const url = `https://${headerData.get("host")}/${card.organization_id}/${card.id}`;

  const [maxPoints, canModify, qrCode] = await Promise.all([
    getMaxCount(card.organization_id),
    canModifyCard(user.id, card.organization_id),
    toDataURL(url, {
      type: "image/webp",
      color: { dark: "#000000FF", light: "#d1d5e1" },
    }),
  ]);

  return (
    <>
      {user.id !== card.user_id && (
        <div className="flex justify-center">
          You are viewing another users card{" "}
        </div>
      )}
      <RewardsCard
        card={card}
        maxPoints={maxPoints}
        canModify={canModify}
        stamps={stamps}
      >
        {(user.id === card.user_id || canModify) && (
          <Image src={qrCode} alt="card-url-code" width="100" height="100" />
        )}
      </RewardsCard>
    </>
  );
}
