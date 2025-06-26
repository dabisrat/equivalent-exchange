'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { checkUserHasOrganization } from '@app/utils/organization';

export function useOrganizationCheck() {
    const { user, loading: authLoading } = useAuth();
    const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkOrganization() {
            if (!user || authLoading) {
                setLoading(authLoading);
                return;
            }

            try {
                const hasOrg = await checkUserHasOrganization();
                setHasOrganization(hasOrg);
            } catch (error) {
                console.error('Error checking organization:', error);
                setHasOrganization(false);
            } finally {
                setLoading(false);
            }
        }

        checkOrganization();
    }, [user, authLoading]);

    return {
        user,
        hasOrganization,
        loading: loading || authLoading,
    };
}
