"use client"

import { NavUser as SharedNavUser } from "@eq-ex/ui/components/nav-user"
import { useAuth } from "@app/hooks/use-auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SharedNavUser
      user={user}
      onSignOut={handleSignOut}
      showSidebarLayout={true}
    />
  )
}
