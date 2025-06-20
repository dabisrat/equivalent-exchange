import CraeteCard from "@app/components/createCard";
import RewardsCardContainer from "@app/components/rewards-card/rewards-card-container";
import { getRewardsCardId } from "@app/utils/data-access";
import { getUser } from '@eq-ex/auth';
import { redirect } from "next/navigation";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const [orgId, cardId] = (await params).id;

  if (cardId) {
    return <RewardsCardContainer cardId={cardId} />;
  }

  if (!cardId) {
    const { id: userId } = await getUser();
    const { id: cardId } = await getRewardsCardId(orgId, userId || "").catch(
      (e) => ({ id: "" })
    );

    if (cardId) {
      redirect(`/${orgId}/${cardId}`);
    }

    if (!cardId) {
      return (
        <div className="flex flex-col gap-4 p-4">
          <span>no card found for {orgId}</span>
          <CraeteCard orgId={orgId} userId={userId}></CraeteCard>
        </div>
      );
    }
  }
}
