import { createRewardCard } from "@app/utils/data-access";
import { Button } from "@eq-ex/ui";

export default async function CraeteCard({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  return (
    <div>
      <form
        action={async () => {
          "use server";
          createRewardCard(userId, orgId);
        }}
      >
        <Button>create card</Button>
      </form>
    </div>
  );
}
