"use client";

import * as React from "react";
import {
  IconDashboard,
  IconInnerShadowTop,
  IconUsers,
  IconPalette,
} from "@tabler/icons-react";

// import { NavDocuments } from "@app/components/nav-documents";
import { NavMain } from "@app/components/nav-main";
// import { NavSecondary } from "@app/components/nav-secondary";
import { OrganizationSwitcher } from "@app/components/organization-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@eq-ex/ui/components/sidebar";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { NavUser } from "@eq-ex/ui/components/nav-user";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@eq-ex/ui/components/dropdown-menu";
import { CreditCard, User } from "lucide-react";
import { useAuth } from "@app/hooks/use-auth";
import Link from "next/link";
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, organizations, activeOrganization } = useMultiOrgContext();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut("/login");
  };

  // Create user data from authenticated user
  const userData = user
    ? {
        name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
      }
    : {
        name: "User",
        email: "",
        avatar: "",
      };

  // Filter navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
    ];

    // Only show Teams and Card Design tabs for admin and owner roles
    if (
      activeOrganization?.role === "admin" ||
      activeOrganization?.role === "owner"
    ) {
      baseItems.push({
        title: "Teams",
        url: "/teams",
        icon: IconUsers,
      });
      baseItems.push({
        title: "Card Design",
        url: "/card-design",
        icon: IconPalette,
      });
    }

    return baseItems;
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {organizations.length > 1 ? (
              // Show organization switcher when user has multiple orgs
              <OrganizationSwitcher />
            ) : (
              // Show static organization name when user has only one org
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  {activeOrganization?.organization_name || "Organization"}
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavItems()} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={userData}
          onSignOut={handleSignOut}
          showSidebarLayout={true}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={"/account"} className="flex items-center gap-2">
                <User />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={"/account/billing"}
                className="flex items-center gap-2"
              >
                <CreditCard />
                Billing
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </NavUser>
      </SidebarFooter>
    </Sidebar>
  );
}
