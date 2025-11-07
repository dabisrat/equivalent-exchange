"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { SidebarMenuButton } from "@eq-ex/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@eq-ex/ui/components/dropdown-menu";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import iconSrc from "@app/app/icon.svg";

export function OrganizationSwitcher() {
  const { organizations, activeOrganization, switchOrganization } =
    useMultiOrgContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchOrganization = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) return;

    try {
      setIsLoading(true);
      await switchOrganization(organizationId);
    } catch (error) {
      console.error("Failed to switch organization:", error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  if (organizations.length <= 1) {
    return null; // Don't show switcher if user only has one org
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className="data-[slot=sidebar-menu-button]:!p-1.5 w-full"
          disabled={isLoading}
        >
          <Image
            src={iconSrc}
            alt="Organization icon"
            width={20}
            height={20}
            className="!size-5"
          />
          <span className="text-base font-semibold truncate">
            {activeOrganization?.organization_name || "Select Organization"}
          </span>
          <IconChevronDown className="h-4 w-4 opacity-50 ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.organization_name}</span>
              <span className="text-xs text-muted-foreground">{org.role}</span>
            </div>
            {org.isActive && <IconCheck className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
