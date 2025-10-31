"use server";
import { AsyncResult } from "@app/schemas/responses";
import { OrganizationTable } from "@app/schemas/organization";
import { OrganizationMembers } from "@app/schemas/organization_members";
import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";

// Type for the organization data returned from the query (subset of OrganizationTable)
type OrganizationQueryResult = Pick<
  OrganizationTable,
  | "id"
  | "organization_name"
  | "max_points"
  | "subdomain"
  | "primary_color"
  | "secondary_color"
  | "logo_url"
  | "is_active"
  | "created_at"
>;

// Derive OrganizationWithRole from the schema types
type OrganizationWithRole = OrganizationQueryResult & {
  role: OrganizationMembers["role"];
  isActive: boolean;
};

type OrganizationsResponse = {
  organizations: OrganizationWithRole[];
  activeOrganization: OrganizationWithRole | null;
  hasOrganizations: boolean;
};

export async function getUsersOrganizations(): AsyncResult<OrganizationsResponse> {
  try {
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

    // Get all organizations the user is a member of
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select(
        `
        organization_id,
        role,
        is_active,
        organization:organization_id (
          id,
          organization_name,
          max_points,
          subdomain,
          primary_color,
          secondary_color,
          logo_url,
          is_active,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (membershipError) {
      console.error("Error fetching organizations:", membershipError);
      return { success: false, message: membershipError.message };
    }

    // Get user's active organization preference
    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("active_organization_id")
      .eq("user_id", user.id)
      .single();

    const organizations: OrganizationWithRole[] =
      memberships?.map((m) => ({
        ...m.organization,
        role: m.role as OrganizationMembers["role"],
        isActive: preferences
          ? m.organization?.id === preferences?.active_organization_id
          : true,
      })) || [];

    // If no active org set, make the first one active (or the one they own)
    let activeOrganization: OrganizationWithRole | null =
      organizations.find((org) => org.isActive) || null;
    if (!activeOrganization && organizations.length > 0) {
      activeOrganization =
        organizations.find((org) => org.role === "owner") || organizations[0];
    }

    return {
      success: true,
      data: {
        organizations,
        activeOrganization,
        hasOrganizations: organizations.length > 0,
      },
    };
  } catch (error) {
    console.error("Unexpected error creating organization", error);
    return {
      success: false,
      message: "Unexpected error creating organization",
    };
  }
}

// Type for organization data with card_config
type OrganizationWithCardConfig = Pick<
  OrganizationTable,
  | "id"
  | "organization_name"
  | "card_config"
  | "primary_color"
  | "logo_url"
  | "max_points"
>;

export async function getOrganizationById(
  organizationId: string
): AsyncResult<OrganizationWithCardConfig> {
  try {
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

    // Check if user is a member of the organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: "Unauthorized" };
    }

    // Fetch organization with card_config
    const { data: organization, error: orgError } = await supabaseAdmin
      .from("organization")
      .select(
        "id, organization_name, card_config, primary_color, logo_url, max_points"
      )
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      console.error("Error fetching organization:", orgError);
      return { success: false, message: "Organization not found" };
    }

    return {
      success: true,
      data: organization as OrganizationWithCardConfig,
    };
  } catch (error) {
    console.error("Unexpected error fetching organization", error);
    return {
      success: false,
      message: "Unexpected error fetching organization",
    };
  }
}
