import { headers } from "next/headers";
import { getOrganizationBySubdomain } from "@app/utils/organization";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get subdomain from middleware headers
    const headersList = await headers();
    const subdomain = headersList.get("x-subdomain") || "www";

    console.log(`🎯 Manifest requested for subdomain: ${subdomain}`);

    // Fetch organization data based on subdomain
    const organizationResult = await getOrganizationBySubdomain(subdomain);
    const organizationData = organizationResult.success
      ? organizationResult.data
      : null;

    // Build dynamic manifest based on organization
    const manifest = {
      name: organizationData?.organization_name
        ? `${organizationData.organization_name} Rewards`
        : "EQ/EX - Equivalent Exchange",
      short_name: organizationData?.organization_name
        ? organizationData.organization_name.length > 15
          ? organizationData.organization_name.substring(0, 15)
          : organizationData.organization_name
        : "EQ/EX",
      description: organizationData?.organization_name
        ? `${organizationData.organization_name} rewards program - powered by Equivalent Exchange`
        : "Change it up with EQ/EX",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: organizationData?.primary_color || "#000000",
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        {
          src: "/api/icons/72",
          sizes: "72x72",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/96",
          sizes: "96x96",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/128",
          sizes: "128x128",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/144",
          sizes: "144x144",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/152",
          sizes: "152x152",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/192",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/384",
          sizes: "384x384",
          type: "image/png",
          purpose: "maskable any",
        },
        {
          src: "/api/icons/512",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any",
        },
      ],
      categories: ["business", "productivity", "social"],
      // TODO: Add screenshots when available
      // screenshots: [
      //   {
      //     src: "/icons/screenshot-wide.png",
      //     sizes: "1280x720",
      //     type: "image/png",
      //     form_factor: "wide",
      //   },
      //   {
      //     src: "/icons/screenshot-narrow.png",
      //     sizes: "720x1280",
      //     type: "image/png",
      //     form_factor: "narrow",
      //   },
      // ],
    };

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating manifest:", error);

    // Fallback to default manifest
    const defaultManifest = {
      name: "EQ/EX - Equivalent Exchange",
      short_name: "EQ/EX",
      description: "Change it up with EQ/EX",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        {
          src: "/icons/manifest-icon-192.maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any",
        },
      ],
      categories: ["business", "productivity"],
    };

    return NextResponse.json(defaultManifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=300", // Shorter cache for fallback
      },
    });
  }
}
