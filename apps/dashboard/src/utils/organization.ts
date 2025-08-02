export interface Organization {
    id: string;
    organization_name: string;
    email: string;
    subdomain: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
}

export interface OrganizationCheckResult {
    hasOrganization: boolean;
    organization: Organization | null;
}

export async function fetchUserOrganization(): Promise<OrganizationCheckResult> {
    try {
        const response = await fetch('/api/organization', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            console.error('Error fetching organization:', response.statusText);
            return { hasOrganization: false, organization: null };
        }

        const data = await response.json();
        return {
            hasOrganization: data.hasOrganization,
            organization: data.organization
        };
    } catch (error) {
        console.error('Error fetching organization:', error);
        return { hasOrganization: false, organization: null };
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

export async function addOrganizationMember({ email, name, role, organization_id }: {
  email: string;
  name: string;
  role: string;
  organization_id: string;
}) {
  try {
    const response = await fetch('/api/organization/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, name, role, organization_id }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to add organization member');
    }
    return { error: null, member: result.member, status: result.status };
  } catch (error: any) {
    return { error: error.message || 'Unexpected error', member: null };
  }
}

export async function fetchUserOrganizationMembers(organization_id: string) {
  if (!organization_id) throw new Error('organization_id is required');
  const response = await fetch(`/api/organization/members?organization_id=${encodeURIComponent(organization_id)}`, {
    method: 'GET',
    credentials: 'include',
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch organization members');
  }
  return result;
}
