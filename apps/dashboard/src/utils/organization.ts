export async function checkUserHasOrganization(): Promise<boolean> {
    try {
        const response = await fetch('/api/organization', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error('Error checking organization:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.hasOrganization;
    } catch (error) {
        console.error('Error checking organization:', error);
        return false;
    }
}

export async function createOrganization(data: {
    organization_name: string;
    max_points: number;
    subdomain?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
}) {
    try {
        const response = await fetch('/api/organization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create organization');
        }

        return result.organization;
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}
