import RewardsCardContainer from "@app/components/rewards-card/rewards-card-container";
import { getRewardsCardId } from "@app/utils/data-access";
import { getUser } from "@eq-ex/auth";
import { redirect } from "next/navigation";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const user = await getUser().catch((e) => null);
  const _params = await params;

  if (!user) {
    redirect(
      `/auth/login?redirectTo=${encodeURIComponent("/" + _params.id.join("/"))}`
    );
  }

  const [orgId, cardId] = (await params).id;

  if (cardId) {
    return <RewardsCardContainer cardId={cardId} />;
  }

  if (!cardId) {
    const { id: cardId } = await getRewardsCardId(orgId, user.id || "").catch(
      (e) => ({ id: "" })
    );

    if (cardId) {
      redirect(`/${orgId}/${cardId}`);
    }

    if (!cardId) {
      redirect("/");
    }
  }
}
