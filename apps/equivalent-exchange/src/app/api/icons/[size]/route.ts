import { headers } from "next/headers";
import { getOrganizationBySubdomain } from "@app/utils/organization";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@eq-ex/shared/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  try {
    const { size: sizeParam } = await params;
    const size = parseInt(sizeParam);

    // Validate size parameter
    if (isNaN(size) || size < 16 || size > 512) {
      return new NextResponse("Invalid size parameter", { status: 400 });
    }

    // Get subdomain from middleware headers
    const headersList = await headers();
    const subdomain = headersList.get("x-subdomain") || "www";

    // Fetch organization data based on subdomain
    const organizationResult = await getOrganizationBySubdomain(subdomain);
    const organizationData = organizationResult.success
      ? organizationResult.data
      : null;

    // Try Supabase Storage first (generated icons)
    if (organizationData && organizationData.id) {
      const supabase = await createClient();

      // Check if icon exists in Supabase Storage
      const iconPath = `organizations/${organizationData.id}/icons/icon-${size}x${size}.png`;
      const { data: fileData, error } = await supabase.storage
        .from("card-backgrounds")
        .list(`organizations/${organizationData.id}/icons`, {
          limit: 1,
          search: `icon-${size}x${size}.png`,
        });

      if (!error && fileData && fileData.length > 0) {
        // Icon exists in Supabase, get public URL
        const { data: publicData } = supabase.storage
          .from("card-backgrounds")
          .getPublicUrl(iconPath);

        return NextResponse.redirect(publicData.publicUrl);
      }
    }

    // Check for local organization-specific icons (legacy support)
    if (organizationData && organizationData.subdomain) {
      const orgIconPath = path.join(
        process.cwd(),
        "public",
        "icons",
        organizationData.subdomain,
        `icon-${size}x${size}.png`
      );

      if (fs.existsSync(orgIconPath)) {
        const iconPath = `/icons/${organizationData.subdomain}/icon-${size}x${size}.png`;
        return NextResponse.redirect(new URL(iconPath, request.url));
      }
    }

    // Fall back to default icons
    const defaultIconPath = `/icons/icon-${size}x${size}.png`;
    return NextResponse.redirect(new URL(defaultIconPath, request.url));
  } catch (error) {
    console.error("Error serving dynamic icon:", error);

    // Fall back to default icon - use a common size if params failed
    const fallbackPath = `/icons/icon-192x192.png`;
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }
}
