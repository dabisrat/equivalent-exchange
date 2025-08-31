"use client";

import { NavUser as SharedNavUser } from "@eq-ex/ui/components/nav-user";
import { useAuth } from "@app/hooks/use-auth";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@eq-ex/ui/components/dropdown-menu";
import { CreditCard, User } from "lucide-react";
import Link from "next/link";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SharedNavUser
      user={user}
      onSignOut={handleSignOut}
      showSidebarLayout={false}
    >
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={"/account"} className="flex items-center gap-2">
            <User />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={"/account/billing"} className="flex items-center gap-2">
            <CreditCard />
            Billing
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </SharedNavUser>
  );
}
