import { headers } from "next/headers";
import { getOrganizationBySubdomain } from "@app/utils/organization";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@eq-ex/shared/server";

function getDefaultIconPath(size: number): string {
  // Map requested sizes to available pwa-asset-generator icons
  switch (size) {
    case 192:
      return "/icons/manifest-icon-192.maskable.png";
    case 512:
      return "/icons/manifest-icon-512.maskable.png";
    case 180:
      return "/icons/apple-icon-180.png";
    case 152:
      return "/icons/apple-icon-180.png"; // Closest available size
    case 144:
      return "/icons/apple-icon-180.png"; // Closest available size
    case 128:
      return "/icons/apple-icon-180.png"; // Closest available size
    case 96:
      return "/icons/apple-icon-180.png"; // Closest available size
    case 72:
      return "/icons/apple-icon-180.png"; // Closest available size
    case 384:
      return "/icons/manifest-icon-512.maskable.png"; // Closest available size
    default:
      return "/icons/manifest-icon-192.maskable.png"; // Fallback
  }
}

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
      // Check if icon exists in Supabase Storage
      const iconPath = `organizations/${organizationData.id}/icons/icon-${size}x${size}.png`;
      const { data: fileData, error } = await supabaseAdmin.storage
        .from("card-backgrounds")
        .list(`organizations/${organizationData.id}/icons`, {
          limit: 1,
          search: `icon-${size}x${size}.png`,
        });

      if (!error && fileData && fileData.length > 0) {
        // Icon exists in Supabase, get public URL
        const { data: publicData } = supabaseAdmin.storage
          .from("card-backgrounds")
          .getPublicUrl(iconPath);

        return NextResponse.redirect(publicData.publicUrl);
      }
    }

    // Fall back to default icons (pwa-asset-generator naming)
    const defaultIconPath = getDefaultIconPath(size);
    return NextResponse.redirect(new URL(defaultIconPath, request.url));
  } catch (error) {
    console.error("Error serving dynamic icon:", error);

    // Fall back to default icon - use a common size if params failed
    const fallbackPath = "/icons/manifest-icon-192.maskable.png";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }
}
