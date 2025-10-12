"use client";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { useAuth } from "@eq-ex/auth";
import { PWAInstallButton } from "./pwa-install-button";
import { useOrganization } from "@app/contexts/organization-context";
import { NavUser } from "@eq-ex/ui/components/nav-user";
import { DropdownMenuItem } from "@eq-ex/ui/components/dropdown-menu";
import { User } from "lucide-react";

import Link from "next/link";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2">
        {/* Main row with title and inline buttons */}
        <div className="h-14 flex items-center justify-between">
          <div className="mr-4 flex-shrink min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {organization?.organization_name} Rewards
            </h1>
            {/* Stylish powered by */}
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                Powered by
              </span>
              <Link
                href="https://eqxrewards.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit eqxrewards.com"
                className="text-xs font-semibold italic tracking-wide bg-gradient-to-r from-sky-600 via-blue-500 to-yellow-400 dark:from-sky-400 dark:via-blue-300 dark:to-amber-300 bg-clip-text text-transparent hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-sky-500/60 rounded-sm transition drop-shadow-[0_0_3px_rgba(160,200,255,0.35)] [font-feature-settings:'ss01','ss02'] font-serif selection:bg-sky-200 selection:text-sky-900"
                style={{
                  fontFamily:
                    "var(--font-brand, var(--font-display, ui-serif))",
                }}
              >
                Equivalent Exchange
              </Link>
            </div>
          </div>

          <div className="flex gap-1.5 items-center flex-shrink-0">
            <ModeToggle />
            {/* Install button hidden on small screens in main row */}
            <div className="hidden min-[601px]:block">
              <PWAInstallButton />
            </div>
            {user && (
              <NavUser
                user={{
                  name: user.user_metadata?.full_name || "User",
                  email: user.email!,
                  avatar: "",
                }}
                onSignOut={async () => {
                  await signOut("/auth/login");
                }}
                showSidebarLayout={false}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </NavUser>
            )}
          </div>
        </div>

        {/* Install button on separate line for small screens */}
        <div className="min-[601px]:hidden pb-2 flex">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
}
