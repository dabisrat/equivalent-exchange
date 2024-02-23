import { redirect } from "next/navigation";
import { getRewardsCardId, getUser } from "@PNN/utils/data-access/data-acess";
import RewardsCardContainer from "@PNN/components/rewards-card/rewards-card-container";
import CraeteCard from "@PNN/components/createCard";

export default async function CardPage({
  params,
}: {
  params: { id: string[] };
}) {
  const [orgId, cardId] = params.id;

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
