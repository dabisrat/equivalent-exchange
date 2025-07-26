import { createClient as createServerClient } from "@eq-ex/shared/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for organization creation
const createOrganizationSchema = z.object({
  organization_name: z.string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  max_points: z.number()
    .int("Max points must be an integer")
    .min(1, "Max points must be at least 1")
    .max(10000, "Max points cannot exceed 10,000"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)")
    .refine((val) => !['www', 'api', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog', 'dev', 'test', 'staging', 'prod', 'production'].includes(val), 
      "This subdomain is reserved"),
  primary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color")
    .default('#3b82f6'),
  secondary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Secondary color must be a valid hex color")
    .default('#64748b'),
  logo_url: z.string().url("Logo URL must be a valid URL").optional(),
});


export async function POST(request: Request) {
  try {
    const supabaseAdmin = await createServerClient(true);
    const supabase = await createServerClient();

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createOrganizationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { organization_name, max_points, subdomain, primary_color, secondary_color, logo_url } = validationResult.data;

    // Check if user already has an organization
    const { data: existingOrg, error: checkError } = await supabaseAdmin
      .from('organization')
      .select('id')
      .eq('email', user.email)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing organization:', checkError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (existingOrg && existingOrg.length > 0) {
      return NextResponse.json(
        { error: "Organization already exists for this email" },
        { status: 409 }
      );
    }

    // Check if subdomain is already taken
    const { data: subdomainCheck, error: subdomainError } = await supabaseAdmin
      .from('organization')
      .select('id')
      .eq('subdomain', subdomain)
      .limit(1);

    if (subdomainError) {
      console.error('Error checking subdomain:', subdomainError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (subdomainCheck && subdomainCheck.length > 0) {
      return NextResponse.json(
        { error: "Subdomain is already taken" },
        { status: 409 }
      );
    }

    // Use a transaction to ensure atomicity
    const { data: transactionResult, error: transactionError } = await supabaseAdmin.rpc('create_organization_with_owner', {
      org_name: organization_name,
      org_email: user.email,
      org_max_points: max_points,
      org_subdomain: subdomain,
      owner_user_id: user.id,
      owner_email: user.email,
      owner_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
      org_primary_color: primary_color,
      org_secondary_color: secondary_color,
      org_logo_url: logo_url || null
    });

    if (transactionError) {
      console.error('Error in organization creation transaction:', transactionError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Get the created organization details
    const { data: newOrg, error: fetchError } = await supabaseAdmin
      .from('organization')
      .select('id, organization_name, email, subdomain, primary_color, secondary_color, logo_url, is_active, created_at')
      .eq('id', transactionResult)
      .single();

    if (fetchError) {
      console.error('Error fetching created organization:', fetchError);
      return NextResponse.json(
        { error: "Organization created but failed to fetch details" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Organization created successfully",
        organization: newOrg
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in organization creation:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = await createServerClient(true);
    const supabase = await createServerClient();

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Check if user has an organization - only return necessary columns
    const { data: organization, error: checkError } = await supabaseAdmin
      .from('organization')
      .select('id, organization_name, email, subdomain, primary_color, secondary_color, logo_url, is_active, created_at')
      .eq('email', user.email)
      .limit(1);

    if (checkError) {
      console.error('Error checking organization:', checkError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasOrganization: organization && organization.length > 0,
      organization: organization?.[0] || null
    });

  } catch (error) {
    console.error('Unexpected error checking organization:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
