import { getUser, createRewardCard } from "@PNN/utils/data-access/data-acess";

export default async function CraeteCard({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {/* TODO check what is the best way to handle forms in server components. should this be a client component */}
      <form action={createRewardCard.bind(null, userId, orgId)}>
        <button className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
          create Card
        </button>
      </form>
    </div>
  );
}
