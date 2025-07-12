"use client";

import { createContext, useContext, ReactNode } from "react";

export interface Organization {
  id: string;
  organization_name: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
}

interface OrganizationContextType {
  organization: Organization | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

interface OrganizationProviderProps {
  children: ReactNode;
  organization: Organization | null;
}

export function OrganizationProvider({
  children,
  organization,
}: OrganizationProviderProps) {
  return (
    <OrganizationContext.Provider value={{ organization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
