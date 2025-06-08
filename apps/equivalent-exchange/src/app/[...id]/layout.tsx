import Logout from "@eq-ex/app/components/logout";
import { getUser } from "@eq-ex/app/utils/data-access/data-acess";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params = Promise.resolve({ id: [] }),
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
