import { getUser, signOut } from "@PNN/utils/data-access/data-acess";
import { Button } from "@PNN/components/ui/button";

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
