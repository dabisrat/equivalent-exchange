import { getUser, signOut } from "@eq-ex/app/utils/data-access/data-acess";
import { Button } from "@eq-ex/ui";

export default async function Logout() {
  const user = await getUser();

  return user ? (
    <div className="flex justify-between p-4">
      Hey, {user.email}!
      <form action={signOut}>
        <Button>Logout</Button>
      </form>
    </div>
  ) : null;
}
