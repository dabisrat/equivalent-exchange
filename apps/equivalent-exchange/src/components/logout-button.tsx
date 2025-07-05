'use client'

import { createClient } from '@eq-ex/shared/client'
import { Button } from '@eq-ex/ui/components/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  return <Button onClick={logout}>Logout</Button>
}
