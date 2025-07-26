'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { fetchUserOrganization, type Organization } from '@app/utils/organization';

export function useOrganizationCheck() {
    const { user, loading: authLoading } = useAuth();
    const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    const refetchOrganization = async () => {
        if (!user || authLoading) return;
        
        try {
            setLoading(true);
            const result = await fetchUserOrganization();
            setHasOrganization(result.hasOrganization);
            setOrganization(result.organization);
        } catch (error) {
            console.error('Error fetching organization:', error);
            setHasOrganization(false);
            setOrganization(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function checkOrganization() {
            if (!user || authLoading) {
                setLoading(authLoading);
                return;
            }

            try {
                const result = await fetchUserOrganization();
                setHasOrganization(result.hasOrganization);
                setOrganization(result.organization);
            } catch (error) {
                console.error('Error checking organization:', error);
                setHasOrganization(false);
                setOrganization(null);
            } finally {
                setLoading(false);
            }
        }

        checkOrganization();
    }, [user, authLoading]);

    return {
        user,
        hasOrganization,
        organization,
        loading: loading || authLoading,
        refetchOrganization, // Allow manual refetch after organization creation
    };
}
