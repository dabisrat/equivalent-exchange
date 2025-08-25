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

export async function addOrganizationMember({
  email,
  name,
  role,
  organization_id,
}: {
  email: string;
  name: string;
  role: string;
  organization_id: string;
}) {
  try {
    const response = await fetch("/api/organization/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, name, role, organization_id }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to add organization member");
    }
    return { error: null, member: result.member, status: result.status };
  } catch (error: any) {
    return { error: error.message || "Unexpected error", member: null };
  }
}

export async function fetchUserOrganizationMembers(organization_id: string) {
  if (!organization_id) throw new Error("organization_id is required");
  const response = await fetch(
    `/api/organization/members?organization_id=${encodeURIComponent(organization_id)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch organization members");
  }
  return result;
}
