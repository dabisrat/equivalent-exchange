"use client";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { useAuth } from "@eq-ex/auth";
import { LogoutButton } from "./logout-button";
import { useOrganization } from "@app/contexts/organization-context";
import { useOrganizationData } from "@app/hooks/use-organization-data";

export function SiteHeader() {
  const { user } = useAuth();
  const { organization } = useOrganization();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 h-14 flex items-center justify-between">
        <div className="mr-4">
          <h1 className="text-lg font-semibold">
            {organization?.organization_name} Rewards
          </h1>
          <p className="text-sm text-muted-foreground">
            powered by Equivalent Exchange
          </p>
        </div>
        <div className="flex gap-1 items-center justify-between">
          <ModeToggle />
          {user && <LogoutButton></LogoutButton>}
        </div>
      </div>
    </header>
  );
}
