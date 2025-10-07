/**
 * Browser-based icon generation for organization onboarding
 * Generates icons using HTML5 Canvas API and uploads to Supabase Storage
 */

export interface OrganizationBranding {
  id: string; // Organization ID for folder structure
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  cardBackgroundUrl?: string;
  subdomain: string;
}

export interface IconGenerationResult {
  success: boolean;
  iconUrls?: Record<string, string>; // size -> Supabase URL
  error?: string;
}

/**
 * Generate organization icons in the browser and upload to Supabase Storage
 */
export async function generateAndUploadOrgIcons(
  branding: OrganizationBranding,
  supabase: any
): Promise<IconGenerationResult> {
  try {
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const iconUrls: Record<string, string> = {};

    console.log(
      `🚀 Starting icon generation for org: ${branding.name} (${branding.id})`
    );
    console.log(
      `🎨 Using colors: ${branding.primaryColor}, ${branding.secondaryColor || "none"}`
    );
    console.log(`🖼️  Logo URL: ${branding.logoUrl || "none - using initials"}`);

    for (let i = 0; i < iconSizes.length; i++) {
      const size = iconSizes[i];
      console.log(
        `📐 Generating ${size}x${size} icon (${i + 1}/${iconSizes.length})`
      );

      try {
        // Generate icon canvas
        const canvas = await createIconCanvas(size, branding);

        // Convert to blob
        const blob = await canvasToBlob(canvas);
        console.log(
          `💾 Generated ${size}x${size} blob: ${(blob.size / 1024).toFixed(1)}KB`
        );

        // Upload to Supabase Storage
        const fileName = `organizations/${branding.id}/icons/icon-${size}x${size}.png`;
        const { error } = await supabase.storage
          .from("card-backgrounds")
          .upload(fileName, blob, {
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
        throw sizeError; // Re-throw to stop the entire process
      }
    }

    console.log(
      `🎉 Successfully generated all ${iconSizes.length} icons for ${branding.name}`
    );

    return {
      success: true,
      iconUrls,
    };
  } catch (error) {
    console.error(`💥 Icon generation failed for ${branding.name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create icon canvas using HTML5 Canvas API
 */
async function createIconCanvas(
  size: number,
  branding: OrganizationBranding
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Clear canvas and set white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  // Option 1: Use logo/card background if available
  if (branding.logoUrl || branding.cardBackgroundUrl) {
    try {
      const imageUrl = branding.logoUrl || branding.cardBackgroundUrl!;
      console.log(`🖼️  Loading logo: ${imageUrl}`);

      const img = await loadImageWithRetry(imageUrl);
      console.log(`✅ Logo loaded successfully: ${img.width}x${img.height}`);

      // Calculate logo size - centered on white background
      const logoSize = size * 0.7; // Larger since we have more space now
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;

      // Apply rounded corners to logo area for modern look
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, logoX, logoY, logoSize, logoSize, logoSize * 0.1);
      ctx.clip();

      // Draw logo with object-fit: cover behavior
      const aspectRatio = img.width / img.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize;
      let drawX = logoX;
      let drawY = logoY;

      if (aspectRatio > 1) {
        // Logo is wider than tall
        drawHeight = logoSize / aspectRatio;
        drawY = logoY + (logoSize - drawHeight) / 2;
      } else {
        // Logo is taller than wide
        drawWidth = logoSize * aspectRatio;
        drawX = logoX + (logoSize - drawWidth) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Add very subtle border for definition (optional)
      ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      ctx.lineWidth = size * 0.005;
      ctx.beginPath();
      roundRect(ctx, logoX, logoY, logoSize, logoSize, logoSize * 0.1);
      ctx.stroke();

      console.log(
        `✅ Logo rendered successfully at ${logoX},${logoY} size ${logoSize}`
      );
    } catch (logoError) {
      console.warn(
        "⚠️  Failed to load logo, falling back to initials:",
        logoError
      );
      // Fall back to initials if logo fails to load
      await createInitialsIcon(ctx, size, branding);
    }
  } else {
    // Option 2: Fallback to initials-based icon
    await createInitialsIcon(ctx, size, branding);
  }

  return canvas;
}

/**
 * Create initials-based icon (fallback when no logo)
 */
async function createInitialsIcon(
  ctx: CanvasRenderingContext2D,
  size: number,
  branding: OrganizationBranding
) {
  // White background is already set in main function, no need to fill again

  // Get initials
  const initials = getInitials(branding.name);

  // Use primary color for text (or fallback to dark gray)
  const textColor = branding.primaryColor || "#1a1a1a";

  // Text styling with subtle shadow
  const fontSize = initials.length === 1 ? size * 0.5 : size * 0.35;
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add subtle shadow for better definition on white background
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetX = size * 0.005;
  ctx.shadowOffsetY = size * 0.005;

  // Draw initials
  ctx.fillText(initials, size / 2, size / 2);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Helper functions
 */
async function loadImageWithRetry(
  url: string,
  maxRetries = 3
): Promise<HTMLImageElement> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await loadImage(url);
    } catch (error) {
      console.warn(
        `🔄 Logo load attempt ${attempt + 1}/${maxRetries} failed:`,
        error
      );
      if (attempt === maxRetries - 1) {
        throw new Error(
          `Failed to load logo after ${maxRetries} attempts: ${url}`
        );
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }
  throw new Error("Unexpected error in loadImageWithRetry");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS

    // Add timeout for loading
    const timeout = setTimeout(() => {
      reject(new Error("Image load timeout"));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      console.log(`✅ Image loaded: ${img.width}x${img.height} from ${url}`);
      resolve(img);
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${url} - ${error}`));
    };

    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to convert canvas to blob"));
    }, "image/png");
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function getContrastingColor(backgroundColor: string): string {
  // Remove # if present
  const color = backgroundColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

function getContrastColor(hexColor: string): string {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
