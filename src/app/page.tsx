import { redirect } from "next/navigation";
import Logout from "@PNN/components/logout";
import {
  getUser,
  getUsersRewardsCards,
} from "@PNN/utils/data-access/data-acess";
import RewardsCardPreview from "@PNN/components/rewards-card/rewards-card-preview";

export default async function App() {
  const user = await getUser();

  if (user) {
    const cards = await getUsersRewardsCards(user.id);
    if (cards?.length) {
      return (
        <>
          <Logout />
          {cards.map((card) => (
            <RewardsCardPreview key={card.id} card={card} />
          ))}
          <div>create new crad</div>
        </>
      );
    } else {
      <div>
        <div>no cards found</div>
        <div>create new crad</div>
      </div>;
    }
  } else {
    redirect("/login");
  }
}
