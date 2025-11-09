"use server";

import sharp from "sharp";
import { createClient } from "@eq-ex/shared/server";

// Icon sizes to generate
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// iOS splash screen sizes (portrait and landscape)
const SPLASH_DIMENSIONS = [
  "640-1136",
  "750-1334",
  "828-1792",
  "1125-2436",
  "1136-640",
  "1170-2532",
  "1242-2208",
  "1242-2688",
  "1284-2778",
  "1334-750",
  "1536-2048",
  "1620-2160",
  "1668-2224",
  "1668-2388",
  "1792-828",
  "2048-1536",
  "2048-2732",
  "2160-1620",
  "2208-1242",
  "2224-1668",
  "2266-1488",
  "2360-1640",
  "2388-1668",
  "2436-1125",
  "2532-1170",
  "2556-1179",
  "2622-1206",
  "2688-1242",
  "2732-2048",
  "2736-1260",
  "2778-1284",
  "2796-1290",
  "2868-1320",
];

interface GenerateClientAssetsParams {
  organizationId: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

interface GenerateClientAssetsResult {
  success: boolean;
  iconUrls?: Record<string, string>;
  splashUrls?: Record<string, string>;
  error?: string;
}

/**
 * Generate and upload PWA icons and splash screens for an organization
 * Server action that creates assets from a logo URL and uploads to Supabase Storage
 */
export async function generateClientAssets(
  params: GenerateClientAssetsParams
): Promise<GenerateClientAssetsResult> {
  const { organizationId, logoUrl, primaryColor = "#ffffff" } = params;
  const supabase = await createClient();
  try {
    console.log(
      `🚀 Starting asset generation for org: ${organizationId}, logo: ${logoUrl}`
    );

    let logoBuffer: Buffer | null = null;

    // Fetch logo if available
    if (logoUrl) {
      try {
        const response = await fetch(logoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch logo: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
        console.log(`✅ Logo fetched successfully`);
      } catch (fetchError) {
        console.warn(
          "⚠️  Failed to fetch logo, will use fallback:",
          fetchError
        );
        logoBuffer = null;
      }
    }

    const iconUrls: Record<string, string> = {};
    const splashUrls: Record<string, string> = {};

    // Generate icons
    for (const size of ICON_SIZES) {
      console.log(`📐 Generating ${size}x${size} icon`);

      try {
        const iconBuffer = logoBuffer
          ? await generateIcon(logoBuffer, size)
          : await generateInitialsIcon(size, primaryColor);

        // Upload to Supabase Storage
        const fileName = `organizations/${organizationId}/icons/icon-${size}x${size}.png`;
        const { error } = await supabase.storage
          .from("card-backgrounds")
          .upload(fileName, iconBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (error) {
          throw new Error(
            `Failed to upload ${size}x${size} icon: ${error.message}`
          );
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from("card-backgrounds")
          .getPublicUrl(fileName);

        iconUrls[`${size}x${size}`] = publicData.publicUrl;
        console.log(`✅ Uploaded ${size}x${size} icon successfully`);
      } catch (sizeError) {
        console.error(`❌ Failed to generate ${size}x${size} icon:`, sizeError);
        throw sizeError;
      }
    }

    // Generate splash screens
    for (const dimensions of SPLASH_DIMENSIONS) {
      const [width, height] = dimensions.split("-").map(Number);
      console.log(`📐 Generating ${width}x${height} splash screen`);

      try {
        const splashBuffer = logoBuffer
          ? await generateSplashScreen(logoBuffer, width, height, primaryColor)
          : await generateInitialsSplash(width, height, primaryColor);

        // Upload to Supabase Storage
        const fileName = `organizations/${organizationId}/splash/apple-splash-${dimensions}.jpg`;
        const { error } = await supabase.storage
          .from("card-backgrounds")
          .upload(fileName, splashBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (error) {
          throw new Error(
            `Failed to upload ${width}x${height} splash screen: ${error.message}`
          );
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from("card-backgrounds")
          .getPublicUrl(fileName);

        splashUrls[dimensions] = publicData.publicUrl;
        console.log(
          `✅ Uploaded ${width}x${height} splash screen successfully`
        );
      } catch (sizeError) {
        console.error(
          `❌ Failed to generate ${width}x${height} splash screen:`,
          sizeError
        );
        throw sizeError;
      }
    }

    console.log(
      `🎉 Successfully generated all ${ICON_SIZES.length} icons and ${SPLASH_DIMENSIONS.length} splash screens`
    );

    return {
      success: true,
      iconUrls,
      splashUrls,
    };
  } catch (error) {
    console.error(`💥 Asset generation failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate icon from logo buffer
 */
async function generateIcon(buffer: Buffer, size: number): Promise<Buffer> {
  // For small icons, use full size for logo to maximize detail and sharpness
  // For larger icons, use 80% with padding
  const logoSize = size <= 32 ? size : Math.floor(size * 0.8);
  const logoMargin = size <= 32 ? 0 : Math.floor((size - logoSize) / 2);

  // Resize logo with high-quality interpolation
  let resizedLogo = await sharp(buffer)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  // Apply sharpening for small icons to reduce blurriness
  if (size <= 32) {
    resizedLogo = await sharp(resizedLogo)
      .sharpen({
        sigma: 0.5,
        m1: 0,
        m2: 1,
        x1: 2,
        y2: 10,
        y3: 20,
      })
      .png()
      .toBuffer();
  }

  // For small icons, return the logo directly without background padding
  if (size <= 32) {
    return resizedLogo;
  }

  // Create canvas with white background and center the logo for larger icons
  return await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        top: logoMargin,
        left: logoMargin,
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Generate splash screen from logo buffer
 */
async function generateSplashScreen(
  buffer: Buffer,
  width: number,
  height: number,
  backgroundColor: string
): Promise<Buffer> {
  // Parse background color
  const bgColor = backgroundColor.startsWith("#")
    ? backgroundColor.slice(1)
    : backgroundColor;

  const r = parseInt(bgColor.slice(0, 2), 16);
  const g = parseInt(bgColor.slice(2, 4), 16);
  const b = parseInt(bgColor.slice(4, 6), 16);

  // Get logo size (40% of smallest dimension for better visibility)
  const logoSize = Math.floor(Math.min(width, height) * 0.4);

  // Resize logo
  const logo = await sharp(buffer)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create splash screen with logo centered
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .composite([
      {
        input: logo,
        gravity: "center",
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Generate initials-based icon (fallback when no logo)
 */
async function generateInitialsIcon(
  size: number,
  color: string
): Promise<Buffer> {
  // For now, create a simple colored square
  // You can enhance this to add text initials if needed
  const bgColor = color.startsWith("#") ? color.slice(1) : color;
  const r = parseInt(bgColor.slice(0, 2), 16);
  const g = parseInt(bgColor.slice(2, 4), 16);
  const b = parseInt(bgColor.slice(4, 6), 16);

  return await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

/**
 * Generate initials-based splash screen (fallback when no logo)
 */
async function generateInitialsSplash(
  width: number,
  height: number,
  color: string
): Promise<Buffer> {
  const bgColor = color.startsWith("#") ? color.slice(1) : color;
  const r = parseInt(bgColor.slice(0, 2), 16);
  const g = parseInt(bgColor.slice(2, 4), 16);
  const b = parseInt(bgColor.slice(4, 6), 16);

  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

interface DeleteClientAssetsParams {
  organizationId: string;
}

interface DeleteClientAssetsResult {
  success: boolean;
  deletedIcons?: number;
  deletedSplashScreens?: number;
  error?: string;
}

/**
 * Delete all PWA icons and splash screens for an organization
 * Server action that removes assets from Supabase Storage
 */
export async function deleteClientAssets(
  params: DeleteClientAssetsParams
): Promise<DeleteClientAssetsResult> {
  const { organizationId } = params;
  const supabase = await createClient();

  try {
    console.log(`🗑️  Starting asset deletion for org: ${organizationId}`);

    let deletedIcons = 0;
    let deletedSplashScreens = 0;

    // Delete icons
    for (const size of ICON_SIZES) {
      try {
        const fileName = `organizations/${organizationId}/icons/icon-${size}x${size}.png`;
        const { error } = await supabase.storage
          .from("card-backgrounds")
          .remove([fileName]);

        if (error) {
          console.warn(
            `⚠️  Failed to delete ${size}x${size} icon: ${error.message}`
          );
        } else {
          deletedIcons++;
          console.log(`✅ Deleted ${size}x${size} icon`);
        }
      } catch (sizeError) {
        console.error(`❌ Error deleting ${size}x${size} icon:`, sizeError);
      }
    }

    // Delete splash screens
    for (const dimensions of SPLASH_DIMENSIONS) {
      try {
        const fileName = `organizations/${organizationId}/splash/apple-splash-${dimensions}.jpg`;
        const { error } = await supabase.storage
          .from("card-backgrounds")
          .remove([fileName]);

        if (error) {
          console.warn(
            `⚠️  Failed to delete ${dimensions} splash screen: ${error.message}`
          );
        } else {
          deletedSplashScreens++;
          console.log(`✅ Deleted ${dimensions} splash screen`);
        }
      } catch (sizeError) {
        console.error(
          `❌ Error deleting ${dimensions} splash screen:`,
          sizeError
        );
      }
    }

    console.log(
      `🎉 Successfully deleted ${deletedIcons} icons and ${deletedSplashScreens} splash screens`
    );

    return {
      success: true,
      deletedIcons,
      deletedSplashScreens,
    };
  } catch (error) {
    console.error(`💥 Asset deletion failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
