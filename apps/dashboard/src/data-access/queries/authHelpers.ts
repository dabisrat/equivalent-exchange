"server-only";

import { AsyncResult } from "@app/schemas/responses";
import { createClient } from "@eq-ex/shared/server";

export async function verifyUserAuthorization(
  organizationId: string
): AsyncResult<null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "User not authenticated" };
  }

  // Verify user has permission to update this organization
  const { data: orgMember, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user?.id)
    .single();

  if (error) {
    return { success: false, message: "Error verifying user authorization" };
  }

  if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
    return { success: false, message: "User not authorized" };
  }

  return { success: true, data: null };
}
