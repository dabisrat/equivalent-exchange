// Enhanced context that supports multiple organizations
"use client";

import React, { useEffect, createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@app/hooks/use-auth";
import { type Organization } from "@app/utils/organization";

interface OrganizationWithRole extends Organization {
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
}

interface MultiOrgContextType {
  user: any;
  organizations: OrganizationWithRole[];
  activeOrganization: OrganizationWithRole | null;
  hasOrganizations: boolean;
  loading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  refetchOrganizations: () => Promise<void>;
}

const MultiOrgContext = createContext<MultiOrgContextType | null>(null);

export function useMultiOrgContext() {
  const context = useContext(MultiOrgContext);
  if (!context) {
    throw new Error('useMultiOrgContext must be used within MultiOrgProvider');
  }
  return context;
}

interface MultiOrgProviderProps {
  children: React.ReactNode;
}

export function MultiOrgProvider({ children }: MultiOrgProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user || authLoading) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/organizations', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);
      setActiveOrganization(data.activeOrganization || null);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
      setActiveOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch organization');
      }

      // Refetch organizations to get updated active state
      await fetchOrganizations();
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchOrganizations();
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!loading && !authLoading && user) {
      if (organizations.length === 0) {
        router.push("/organization-setup");
      }
    }
  }, [organizations, loading, authLoading, user, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || organizations.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <MultiOrgContext.Provider
      value={{
        user,
        organizations,
        activeOrganization,
        hasOrganizations: organizations.length > 0,
        loading: loading || authLoading,
        switchOrganization,
        refetchOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </MultiOrgContext.Provider>
  );
}

// Backward compatibility: Single org context that uses active organization
export function useOrganizationContext() {
  const { activeOrganization, user, hasOrganizations } = useMultiOrgContext();
  
  return {
    user,
    organization: activeOrganization,
    hasOrganization: hasOrganizations,
  };
}
