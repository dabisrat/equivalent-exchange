import Logout from "@PNN/components/logout";
import { getUser } from "@PNN/utils/data-access/data-acess";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params = Promise.resolve( { id: [] }),
}: {
  children: React.ReactNode;
  params: Promise<{ id: string[] }>;
}) {
  const user = await getUser().catch((e) => null);

  if (!user) {
    redirect(`/login/${(await params).id.join("/")}`);
  } else {
    return (
      <>
        <Logout />
        {children}
      </>
    );
  }
}
