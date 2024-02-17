import { redirect } from "next/navigation";
import Logout from "@PNN/components/logout";
import {
  getUser,
  getUsersRewardsCards,
} from "@PNN/utils/data-access/data-acess";
import RewardsCardPreview from "@PNN/components/rewards-card/rewards-card-preview";

export default async function App() {
  const user = await getUser().catch((e) => null);

  if (user) {
    const cards = await getUsersRewardsCards(user.id);

    return (
      <>
        <Logout />
        {!!cards.length &&
          cards.map((card) => <RewardsCardPreview key={card.id} card={card} />)}
        {!cards.length && <> no cards found </>}
      </>
    );
  } else {
    redirect("/login");
  }
}
