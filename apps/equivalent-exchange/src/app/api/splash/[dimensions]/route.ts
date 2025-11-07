import { headers } from "next/headers";
import { getOrganizationBySubdomain } from "@app/utils/organization";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@eq-ex/shared/server";

function getDefaultSplashPath(dimensions: string): string {
  // The dimensions come as "width-height", e.g., "2048-2732"
  return `/icons/apple-splash-${dimensions}.jpg`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string }> }
) {
  try {
    const { dimensions } = await params;

    // Validate dimensions parameter (should be width-height format)
    if (!dimensions || !/^\d+-\d+$/.test(dimensions)) {
      return new NextResponse("Invalid dimensions parameter", { status: 400 });
    }

    // Get subdomain from middleware headers
    const headersList = await headers();
    const subdomain = headersList.get("x-subdomain") || "www";

    // Fetch organization data based on subdomain
    const organizationResult = await getOrganizationBySubdomain(subdomain);
    const organizationData = organizationResult.success
      ? organizationResult.data
      : null;

    // Try Supabase Storage first (generated splash screens)
    if (organizationData && organizationData.id) {
      // Check if splash screen exists in Supabase Storage
      const splashPath = `organizations/${organizationData.id}/splash/apple-splash-${dimensions}.jpg`;
      const { data: fileData, error } = await supabaseAdmin.storage
        .from("card-backgrounds")
        .list(`organizations/${organizationData.id}/splash`, {
          limit: 1,
          search: `apple-splash-${dimensions}.jpg`,
        });

      if (!error && fileData && fileData.length > 0) {
        // Splash screen exists in Supabase, get public URL
        const { data: publicData } = supabaseAdmin.storage
          .from("card-backgrounds")
          .getPublicUrl(splashPath);

        return NextResponse.redirect(publicData.publicUrl);
      }
    }

    // Fall back to default splash screens
    const defaultSplashPath = getDefaultSplashPath(dimensions);
    return NextResponse.redirect(new URL(defaultSplashPath, request.url));
  } catch (error) {
    console.error("Error serving dynamic splash screen:", error);

    // Fall back to default splash screen - use a common size if params failed
    const fallbackPath = "/icons/apple-splash-1125-2436.jpg";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }
}
