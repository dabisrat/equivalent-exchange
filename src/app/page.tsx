import { redirect } from "next/navigation";
import { createClient } from "@PNN/utils/supabase/server";
import { cookies } from "next/headers";
import RewardsCardContainer from "../components/rewards-card/rewards-card-container";
import Logout from "../components/logout";

export default async function App() {
  const client = createClient(cookies());
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session?.user) {
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
