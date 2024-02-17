import { createRewardCard } from "@PNN/utils/data-access/data-acess";
import { Button } from "@PNN/components/ui/button";

export default async function CraeteCard({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  return (
    <div>
      {/* TODO check what is the best way to handle forms in server components. should this be a client component */}
      <form action={createRewardCard.bind(null, userId, orgId)}>
        <Button>create card</Button>
      </form>
    </div>
  );
}
