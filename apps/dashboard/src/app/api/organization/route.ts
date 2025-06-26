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
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

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

    const { organization_name, max_points } = validationResult.data;

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

    // Create the organization with the authenticated user's email
    const { data: newOrg, error: createError } = await supabase
      .from('organization')
      .insert([{
        organization_name,
        email: user.email, // Use the authenticated user's email
        max_points,
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
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

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
