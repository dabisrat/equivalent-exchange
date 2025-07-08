"use client"

import { useEffect, useState } from 'react';

export type OrganizationData = {
  id: string;
  organizationName: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
} | null;

export function useOrganizationData(): OrganizationData {
  const [organizationData, setOrganizationData] = useState<OrganizationData>(null);

  useEffect(() => {
    // Extract organization data from document meta tags (set by server-side layout)
    const getMetaContent = (name: string): string => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      return meta?.getAttribute('content') || '';
    };

    const id = getMetaContent('organization-id');
    const organizationName = getMetaContent('organization-name');
    const subdomain = getMetaContent('organization-subdomain');
    const primaryColor = getMetaContent('organization-primary-color');
    const secondaryColor = getMetaContent('organization-secondary-color');
    const logoUrl = getMetaContent('organization-logo-url');

    if (id && organizationName) {
      setOrganizationData({
        id,
        organizationName,
        subdomain,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#64748b',
        logoUrl,
      });
    } else {
      setOrganizationData(null);
    }
  }, []);

  return organizationData;
}

// Helper hook to check if we're in an organization context
export function useIsOrganizationContext(): boolean {
  const organizationData = useOrganizationData();
  return organizationData !== null;
}
