'use client';

import { useEffect, useState } from 'react'
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle"
import { getUser, signOut } from '@eq-ex/auth'
import { createBrowserClient } from '@eq-ex/shared'
import type { User } from '@supabase/supabase-js'
import { Button } from '@eq-ex/ui/components/button';
import { BiLogOut } from 'react-icons/bi';

export function SiteHeader() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createBrowserClient()

    useEffect(() => {
        // Get initial user
        const getCurrentUser = async () => {
            try {
                const currentUser = await getUser()
                setUser(currentUser)
            } catch (error) {
                console.error('Failed to get user:', error)
                setUser(null)
            }
        }

        getCurrentUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session)
                if (session?.user) {
                    setUser(session.user)
                } else {
                    setUser(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const handleSignOut = async () => {
        try {
            await signOut()
            setUser(null)
        } catch (error) {
            console.error('Failed to sign out:', error)
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-2 h-14 flex items-center justify-between">
                <div className="mr-4">
                    <h1 className="text-lg font-semibold">Equivalent Exchange</h1>
                </div>
                <div className="flex gap-1 items-center justify-between">
                    <ModeToggle />
                    {user &&
                        < Button variant="ghost" onClick={handleSignOut} className="gap-2">
                            <BiLogOut className="h-4 w-4" />
                            Logout
                        </Button>}
                </div>
            </div>
        </header >
    )
}
