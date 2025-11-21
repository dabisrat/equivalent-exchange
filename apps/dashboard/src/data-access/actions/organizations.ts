"use server";
import { AsyncResult } from "@app/schemas/responses";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from "../../schemas/organization";
import {
  createOrganizationMember,
  type CreateOrganizationMember,
  rolesWithMemberManagementPermission,
} from "../../schemas/organization_members";
import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";
import { commonValidations } from "@app/schemas/common";

export async function createOrganization(
  data: CreateOrganizationInput
): AsyncResult<string> {
  try {
    // Validate the input data
    const validatedData = createOrganizationSchema.safeParse(data);

    if (!validatedData.success) {
      return { success: false, message: validatedData.error.message };
    }

    const {
      organization_name,
      max_points,
      subdomain,
      primary_color,
      secondary_color,
      logo_url,
    } = validatedData.data;

    const supabase = await createServerClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Unauthorized access:", authError);
      return { success: false, message: "Unauthorized" };
    }

    if (!user.email) {
      return {
        success: false,
        message: "User email is required to create organization",
      };
    }

    // for free plans you can only create one organization per email
    // for paid plans you can create multiple organizations per email
    // TODO: add tier logic
    const isFreeTier = false;
    if (isFreeTier) {
      const { data: existingOrg, error: checkError } = await supabaseAdmin
        .from("organization")
        .select("id")
        .eq("email", user.email)
        .limit(1);

      if (checkError) {
        console.error("Error checking existing organization:", checkError);
        return { success: false, message: "Database error" };
      }

      if (existingOrg && existingOrg.length > 0) {
        console.warn("Error checking existing organization:", checkError);
        return {
          success: false,
          message: "Organization already exists for this email",
        };
      }
    }

    // Check if subdomain is already taken
    const { data: subdomainCheck, error: subdomainError } = await supabaseAdmin
      .from("organization")
      .select("id")
      .eq("subdomain", subdomain)
      .limit(1);

    if (subdomainError) {
      console.error("Error checking subdomain:", subdomainError);
      return { success: false, message: "Database error" };
    }

    if (subdomainCheck && subdomainCheck.length > 0) {
      return {
        success: false,
        message: "Subdomain is already taken",
      };
    }

    // Use a transaction to ensure atomicity
    const { data: organizationId, error: transactionError } =
      await supabaseAdmin.rpc("create_organization_with_owner", {
        org_name: organization_name,
        org_email: user.email,
        org_max_points: max_points,
        org_subdomain: subdomain,
        owner_user_id: user.id,
        owner_email: user.email,
        owner_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner",
        org_primary_color: primary_color,
        org_secondary_color: secondary_color,
        org_logo_url: logo_url,
      });

    if (transactionError) {
      console.error(
        "Error in organization creation transaction:",
        transactionError
      );
      return { success: false, message: "Failed to create organization" };
    }

    return { success: true, data: organizationId };
  } catch (error) {
    console.error("Unexpected error in organization creation:", error);
    return { success: false, message: "Error creating organization" };
  }
}

export async function switchOrganization(
  organizationId: string
): AsyncResult<string> {
  try {
    const validatedData = commonValidations.id.safeParse(organizationId);

    if (!validatedData.success) {
      return { success: false, message: validatedData.error.message };
    }

    // Get the current authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify user is a member of this organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: "Access denied" };
    }

    // Update or create user preferences
    const { error: prefError } = await supabaseAdmin
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          active_organization_id: organizationId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id", // This tells SupabaseAdmin: "If user_id already exists, UPDATE instead of INSERT"
        }
      )
      .select();

    if (prefError) {
      return { success: false, message: "Failed to switch organization" };
    }

    return { success: true, data: "Organization switched successfully" };
  } catch (error) {
    console.error("Unexpected error switching organization:", error);
    return { success: false, message: "Error switching organization" };
  }
}

export async function addOrganizationMember(
  data: CreateOrganizationMember & { organization_id: string }
): AsyncResult<any> {
  try {
    // Validate the input data
    const validatedMemberData = createOrganizationMember.safeParse(data);
    const validatedOrgId = commonValidations.id.safeParse(data.organization_id);

    if (!validatedMemberData.success) {
      return { success: false, message: validatedMemberData.error.message };
    }

    if (!validatedOrgId.success) {
      return { success: false, message: "Invalid organization ID" };
    }

    const { email, name, role } = validatedMemberData.data;
    const organization_id = validatedOrgId.data;

    // Get the current authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify user has permission to add members (must be owner or admin)
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .in("role", rolesWithMemberManagementPermission)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: "Access denied" };
    }

    // Check if member already exists
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from("organization_members")
      .select("user_id")
      .eq("email", email)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing member:", checkError);
      return { success: false, message: "Database error" };
    }

    if (existingMember) {
      return { success: false, message: "Member already exists" };
    }

    // Invite user via Supabase Auth Admin (works for both new and existing users)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/login`;
    const invitedAt = new Date().toISOString();

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: callbackUrl,
        data: {
          invited_org: organization_id,
        },
      });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      return { success: false, message: "Failed to send invite" };
    }

    // Add member record - inviteData will contain user info for both new and existing users
    const invitedUserId = inviteData?.user?.id;
    if (invitedUserId) {
      const { data: newMember, error: insertError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id,
          user_id: invitedUserId,
          email,
          name: name || email.split("@")[0],
          role,
          is_active: false, // They'll be activated when they accept the invite/login
          invited_by: user.id,
          invited_at: invitedAt,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error adding member:", insertError);
        return { success: false, message: "Failed to add member" };
      }

      return {
        success: true,
        data: {
          member: newMember,
          status: "invited",
        },
      };
    } else {
      return {
        success: false,
        message: "Failed to get user information from invite",
      };
    }
  } catch (error) {
    console.error("Unexpected error adding organization member:", error);
    return { success: false, message: "Error adding organization member" };
  }
}

export async function updateOrganization(
  organizationId: string,
  data: UpdateOrganizationInput
): AsyncResult<void> {
  try {
    // Validate the input data
    const validatedData = updateOrganizationSchema.safeParse(data);

    if (!validatedData.success) {
      return { success: false, message: validatedData.error.message };
    }

    const supabase = await createServerClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Unauthorized access:", authError);
      return { success: false, message: "Unauthorized" };
    }

    // Verify user has permission to update this organization
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
      return {
        success: false,
        message: "Insufficient permissions to update organization",
      };
    }

    // Update organization
    const { error } = await supabase
      .from("organization")
      .update(validatedData.data)
      .eq("id", organizationId);

    if (error) {
      console.error("Error updating organization:", error);
      return { success: false, message: "Failed to update organization" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error updating organization:", error);
    return { success: false, message: "Error updating organization" };
  }
}

export async function removeOrganizationMember({
  organization_id,
  user_id,
}: {
  organization_id: string;
  user_id: string;
}): AsyncResult<void> {
  try {
    const validatedOrgId = commonValidations.id.safeParse(organization_id);
    const validatedUserId = commonValidations.id.safeParse(user_id);

    if (!validatedOrgId.success || !validatedUserId.success) {
      return { success: false, message: "Invalid ID format" };
    }

    const supabase = await createServerClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized" };
    }

    // Prevent removing oneself
    if (user_id === user.id) {
      return { success: false, message: "Cannot remove yourself" };
    }

    // Verify user has permission to remove members (must be owner or admin)
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .in("role", rolesWithMemberManagementPermission)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: "Access denied" };
    }

    // Check target member's role to prevent removing owners
    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user_id)
      .eq("organization_id", organization_id)
      .single();

    if (targetError || !targetMember) {
      return { success: false, message: "Member not found" };
    }

    if (targetMember.role === "owner") {
      return { success: false, message: "Cannot remove an owner" };
    }

    // Delete the member
    const { error: deleteError } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("organization_id", organization_id)
      .eq("user_id", user_id);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return { success: false, message: "Failed to remove member" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error removing organization member:", error);
    return { success: false, message: "Error removing organization member" };
  }
}
