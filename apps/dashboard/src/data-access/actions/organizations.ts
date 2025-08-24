"use server";
import { AsyncResult } from "@app/schemas/responses";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "../../schemas/organization";

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
