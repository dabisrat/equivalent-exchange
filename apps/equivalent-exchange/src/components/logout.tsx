import { getUser, signOut } from '@eq-ex/auth';
import { Button } from "@eq-ex/ui/components/button";

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
