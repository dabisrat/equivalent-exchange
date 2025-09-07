"use client";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { useAuth } from "@eq-ex/auth";
import { LogoutButton } from "./logout-button";
import { useOrganization } from "@app/contexts/organization-context";

import Link from "next/dist/client/link";

export function SiteHeader() {
  const { user } = useAuth();
  const { organization } = useOrganization();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 h-14 flex items-center justify-between max-[380px]:flex-col max-[380px]:h-auto max-[380px]:py-2 max-[380px]:gap-1">
        <div className="mr-4 max-[380px]:mr-0 max-[380px]:text-center">
          <h1 className="text-lg font-semibold">
            {organization?.organization_name} Rewards
          </h1>
          {/* Stylish powered by */}
          <div className="mt-0.5 flex items-center gap-1 max-[380px]:justify-center">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Powered by
            </span>
            <Link
              href="https://eqxrewards.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit eqxrewards.com"
              className="text-xs font-semibold italic tracking-wide bg-gradient-to-r from-sky-600 via-blue-500 to-yellow-400 dark:from-sky-400 dark:via-blue-300 dark:to-amber-300 bg-clip-text text-transparent hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-sky-500/60 rounded-sm transition drop-shadow-[0_0_2px_rgba(0,0,0,0.35)] drop-shadow-[0_0_4px_rgba(160,200,255,0.35)] [font-feature-settings:'ss01','ss02'] font-serif selection:bg-sky-200 selection:text-sky-900"
              style={{
                fontFamily: "var(--font-brand, var(--font-display, ui-serif))",
              }}
            >
              Equivalent Exchange
            </Link>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <ModeToggle />
          {user && <LogoutButton></LogoutButton>}
        </div>
      </div>
    </header>
  );
}
