'use client';

import { useEffect, useState } from 'react'
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle"
import { NavUser } from "@eq-ex/ui/components/nav-user"
import { getUser, signOut } from '@eq-ex/auth'
import { createBrowserClient } from '@eq-ex/shared'
import type { User } from '@supabase/supabase-js'

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
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">

                    <nav className="flex items-center gap-2">
                        {user && (
                            <NavUser
                                user={{
                                    name: user.user_metadata?.full_name || user.email || 'User',
                                    email: user.email || '',
                                    avatar: user.user_metadata?.avatar_url || '',
                                }}
                                onSignOut={handleSignOut}
                                showSidebarLayout={false}
                            />
                        )}
                    </nav>
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}
