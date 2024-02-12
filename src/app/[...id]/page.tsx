import { redirect } from "next/navigation";
import { getRewardsCardId, getUser } from "@PNN/utils/data-access/data-acess";
import RewardsCardContainer from "@PNN/components/rewards-card/rewards-card-container";

export default async function CardPage({
  params,
}: {
  params: { id: string[] };
}) {
  const [orgId, cardId] = params.id;

  if (orgId && cardId) {
    return <RewardsCardContainer cardId={cardId} />;
  }

  if (orgId) {
    const user = await getUser();
    const { id: cardId } = await getRewardsCardId(orgId, user?.id || "").catch(
      () => {
        redirect("/");
      }
    );
    redirect(`/${orgId}/${cardId}`);
  }
}
