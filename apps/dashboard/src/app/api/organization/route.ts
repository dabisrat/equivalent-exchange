import { createServerClient } from "@eq-ex/shared";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
      "This subdomain is reserved")
    .optional(),
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
    const { data: existingOrg, error: checkError } = await supabase
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

    // Check if subdomain is already taken (if provided)
    if (subdomain) {
      const { data: subdomainCheck, error: subdomainError } = await supabase
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
    }

    // Create the organization with the authenticated user's email
    const { data: newOrg, error: createError } = await supabase
      .from('organization')
      .insert([{
        organization_name,
        email: user.email, // Use the authenticated user's email
        max_points,
        subdomain,
        primary_color,
        secondary_color,
        logo_url,
        is_active: true,
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating organization:', createError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Automatically add creator as organization owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        role: 'owner',
        invited_by: user.id // Self-invited
      });

    if (memberError) {
      console.error('Error adding organization owner:', memberError);
      // Note: We could consider rolling back the organization creation here
      // For now, we'll log the error but still return success
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

    // Check if user has an organization
    const { data: organization, error: checkError } = await supabase
      .from('organization')
      .select('*')
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
