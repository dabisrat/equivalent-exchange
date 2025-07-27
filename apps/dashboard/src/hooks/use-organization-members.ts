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

export function useOrganizationMembers() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/organization/members");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch members");
        setMembers(data.members || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  return { members, loading, error };
}
