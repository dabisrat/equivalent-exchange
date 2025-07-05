'use client';
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle"
import { useAuth } from '@eq-ex/auth'
import { LogoutButton } from './logout-button';

export function SiteHeader() {

    const { user } = useAuth()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-2 h-14 flex items-center justify-between">
                <div className="mr-4">
                    <h1 className="text-lg font-semibold">Equivalent Exchange</h1>
                </div>
                <div className="flex gap-1 items-center justify-between">
                    <ModeToggle />
                    {user && <LogoutButton></LogoutButton>
                    }
                </div>
            </div>
        </header >
    )
}
