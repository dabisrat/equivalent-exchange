import "server-only";
import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";

export async function getMaxCount(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("organization")
    .select("max_points")
    .eq("id", orgId)
    .single();

  if (error) {
    throw error;
  }

  return data.max_points;
}

export async function canModifyCard(userId: string, orgId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("is_active")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  return data?.is_active === true;
}

// Add new function for role checking
export async function getOrganizationMemberRole(userId: string, orgId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  if (error || !data?.is_active) return null;
  return data.role;
}
