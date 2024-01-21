import { redirect } from "next/navigation";
import RewardsCardContainer from "../components/rewards-card/rewards-card-container";
import Logout from "../components/logout";
import { getUser } from "@PNN/utils/data-access/data-acess";

export default async function App() {
  const user = await getUser();

  if (user) {
    return (
      <div>
        <Logout />
        <RewardsCardContainer />
      </div>
    );
  } else {
    redirect("/auth");
  }
}
