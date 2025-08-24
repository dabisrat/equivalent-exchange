// New API endpoint: /api/organizations (plural)
// GET /api/organizations - Get all organizations for current user
// POST /api/organizations/switch - Switch active organization

import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Get user's active organization preference
    const { data: preferences, error: preferencesError } = await supabaseAdmin
      .from("user_preferences")
      .select("active_organization_id")
      .eq("user_id", user.id)
      .single();

    if (preferencesError && preferencesError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is OK
      console.error("Error fetching preferences:", preferencesError);
    }

    const organizations =
      memberships?.map((m) => ({
        ...(m.organization as any),
        role: m.role,
        isActive: preferences
          ? (m.organization as any)?.id === preferences.active_organization_id
          : true,
      })) || [];

    // If no active org set, make the first one active (or the one they own)
    let activeOrganization = organizations.find((org) => org.isActive);
    if (!activeOrganization && organizations.length > 0) {
      activeOrganization =
        organizations.find((org) => org.role === "owner") || organizations[0];
    }

    return NextResponse.json({
      organizations,
      activeOrganization,
      hasOrganizations: organizations.length > 0,
    });
  } catch (error) {
    console.error("Unexpected error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { organizationId } = body;

    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update or create user preferences

    const { data: upsertData, error: prefError } = await supabaseAdmin
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
      return NextResponse.json(
        { error: "Failed to switch organization", details: prefError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Organization switched successfully",
    });
  } catch (error) {
    console.error("Unexpected error switching organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
