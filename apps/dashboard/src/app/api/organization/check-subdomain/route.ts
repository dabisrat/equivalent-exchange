import { createServerClient } from "@eq-ex/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for subdomain check
const subdomainCheckSchema = z.object({
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)")
});

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog', 
  'dev', 'test', 'staging', 'prod', 'production', 'support', 'help',
  'docs', 'status', 'cdn', 'assets', 'static', 'files', 'uploads'
];

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = subdomainCheckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          available: false,
          error: "Invalid subdomain format",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { subdomain } = validationResult.data;

    // Check if subdomain is reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return NextResponse.json({
        available: false,
        error: "This subdomain is reserved and cannot be used"
      });
    }

    // Check if subdomain is already taken
    const { data: existingOrg, error: checkError } = await supabase
      .from('organization')
      .select('id')
      .eq('subdomain', subdomain)
      .limit(1);

    if (checkError) {
      console.error('Error checking subdomain availability:', checkError);
      return NextResponse.json(
        { 
          available: false,
          error: "Database error" 
        },
        { status: 500 }
      );
    }

    const isAvailable = !existingOrg || existingOrg.length === 0;

    return NextResponse.json({
      available: isAvailable,
      subdomain: subdomain,
      message: isAvailable 
        ? "Subdomain is available" 
        : "Subdomain is already taken"
    });

  } catch (error) {
    console.error('Unexpected error checking subdomain:', error);
    return NextResponse.json(
      { 
        available: false,
        error: "Internal server error" 
      },
      { status: 500 }
    );
  }
}
