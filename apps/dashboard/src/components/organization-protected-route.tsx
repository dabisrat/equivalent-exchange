"use client";

import React, { useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationCheck } from "@app/hooks/use-organization-check";
import { type Organization } from "@app/utils/organization";

// Create context for organization data
interface OrganizationContextType {
  user: any;
  organization: Organization | null;
  hasOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

// Hook to use organization context
export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganizationContext must be used within OrganizationProtectedRoute"
    );
  }
  return context;
}

interface OrganizationProtectedRouteProps {
  children: React.ReactNode;
}

export function OrganizationProtectedRoute({
  children,
}: OrganizationProtectedRouteProps) {
  const { user, hasOrganization, organization, loading } =
    useOrganizationCheck();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (hasOrganization === false) {
        router.push("/organization-setup");
      }
    }
  }, [user, hasOrganization, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || hasOrganization === false) {
    return null; // Will redirect via useEffect
  }

  // Provide organization data through context
  return (
    <OrganizationContext.Provider
      value={{
        user,
        organization,
        hasOrganization: hasOrganization ?? false,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
