"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@app/hooks/use-auth';
import { fetchUserOrganization, type Organization } from '@app/utils/organization';

interface OrganizationContextType {
  organization: Organization | null;
  hasOrganization: boolean;
  loading: boolean;
  error: string | null;
  refetchOrganization: () => Promise<void>;
  updateOrganization: (org: Organization) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchOrganization = async () => {
    if (!user || authLoading) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchUserOrganization();
      setOrganization(result.organization);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Failed to fetch organization data');
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = (org: Organization) => {
    setOrganization(org);
  };

  useEffect(() => {
    if (user && !authLoading) {
      refetchOrganization();
    } else if (!user) {
      setOrganization(null);
      setLoading(authLoading);
    }
  }, [user, authLoading]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        hasOrganization: !!organization,
        loading: loading || authLoading,
        error,
        refetchOrganization,
        updateOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
