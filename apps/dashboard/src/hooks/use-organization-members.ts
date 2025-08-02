import { fetchUserOrganizationMembers } from "../utils/organization";
import { useEffect, useState } from "react";

export interface OrganizationMember {
  user_id: string | null;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  invited_at: string;
  invited_by: string;
  created_at: string;
}

export function useOrganizationMembers(organization_id: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!organization_id) {
      setError("organization_id is required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserOrganizationMembers(organization_id);
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organization_id]);

  return { members, loading, error, refetch: fetchMembers };
}
