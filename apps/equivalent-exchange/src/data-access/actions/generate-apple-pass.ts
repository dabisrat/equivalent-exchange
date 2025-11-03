"use server";

import { supabaseAdmin } from "@eq-ex/shared/server";
import { getUser } from "@eq-ex/auth";
import { headers } from "next/headers";
import type { AsyncResult } from "@eq-ex/shared";
import {
  getPassTemplate,
  generateSerialNumber,
  generateAuthToken,
  downloadAndProcessPassImages,
} from "@eq-ex/shared/apple-wallet";
import { createLogger } from "@eq-ex/shared/logger";
import type { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";

const logger = createLogger({ service: "apple-wallet-pass-generation" });

interface ApplePassData {
  cardId: string;
  organizationId: string;
}

async function getCurrentDomain(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost:3000";

  // Always use HTTPS in production
  // For localhost development, don't include webServiceURL (it's optional)
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocalhost) {
    return `http://${host}`;
  }

  // For production, always use HTTPS
  return `https://${host}`;
}

export async function generateAppleWalletPass({
  cardId,
  organizationId,
}: ApplePassData): Promise<AsyncResult<number[]>> {
  const logContext = {
    operation: "generateAppleWalletPass",
    cardId,
    organizationId,
  };

  logger.info("Pass generation started", logContext);

  try {
    const user = await getUser();
    if (!user) {
      logger.warn("User not authenticated", logContext);
      return { success: false, error: "User not authenticated" };
    }

    logger.debug("User authenticated", { ...logContext, userId: user.id });

    // Check if a pass already exists for this user and card
    const { data: existingPass } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("serial_number, authentication_token, created_at")
      .eq("user_id", user.id)
      .eq("card_id", cardId)
      .single();

    // If pass exists, regenerate with same credentials
    // This ensures the pass can be re-downloaded without breaking registrations
    const serialNumber = existingPass?.serial_number || generateSerialNumber();
    const authenticationToken =
      existingPass?.authentication_token || generateAuthToken();

    if (existingPass) {
      logger.debug("Reusing existing pass credentials", {
        ...logContext,
        serialNumber,
        existingSince: existingPass.created_at,
      });
    }

    // Fetch card data with organization details and stamps
    const { data: cardData, error: queryError } = await supabaseAdmin
      .from("reward_card")
      .select(
        `
        organization!inner(organization_name, card_config, primary_color, logo_url, max_points),
        stamp(stamp_index, stamped)
      `
      )
      .eq("id", cardId)
      .eq("organization.id", organizationId)
      .single();

    if (queryError || !cardData) {
      logger.error("Card data fetch failed", {
        ...logContext,
        error: queryError?.message,
      });
      return { success: false, error: "Card or organization not found" };
    }

    logger.debug("Card data fetched", {
      ...logContext,
      organizationName: cardData.organization?.organization_name,
      stampCount: cardData.stamp?.filter((s: any) => s.stamped).length,
    });

    const org = cardData.organization;
    const stamps = cardData.stamp;
    const currentStamps = stamps.filter((s) => s.stamped).length;
    const maxPoints = org.max_points;

    // Type assertion for card_config
    const cardConfig = org.card_config as unknown as OrganizationCardConfig;

    // Get Apple Wallet configuration
    const appleConfig = cardConfig?.apple_wallet_pass_config;
    const backgroundColor = appleConfig?.backgroundColor || "#3b82f6";
    const foregroundColor = appleConfig?.foregroundColor || "#ffffff";
    const labelColor = appleConfig?.labelColor || "#e5e7eb";

    // Get current domain for QR code and web service URL
    const currentDomain = await getCurrentDomain();
    const isLocalhost = currentDomain.startsWith("http://");

    logger.debug("Domain detected", {
      ...logContext,
      currentDomain,
      isLocalhost,
      includeWebService: !isLocalhost,
    });

    const orgName = org.organization_name || "Loyalty Program";

    // Get cached template (created once and reused for all passes)
    const template = await getPassTemplate();

    // Download and process images from configured URLs
    const images = await downloadAndProcessPassImages({
      iconImage: appleConfig?.iconImage,
      logoImage: appleConfig?.logoImage,
      stripImage: appleConfig?.stripImage,
    });

    // Create a Pass instance from the template with dynamic data
    const passConfig: any = {
      serialNumber,
      description: appleConfig?.description || `${orgName} Loyalty Card`,
      organizationName: orgName,
      logoText: appleConfig?.logoText || orgName,
      backgroundColor,
      foregroundColor,
      labelColor,
      // Only include webServiceURL if we're on HTTPS (Apple requirement)
      ...(isLocalhost
        ? {}
        : {
            webServiceURL: `${currentDomain}/api/apple-wallet`,
            authenticationToken,
          }),
      barcodes: [
        {
          message: `${currentDomain}/${organizationId}/${cardId}`,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
        },
      ],
      storeCard: {
        primaryFields: [
          {
            key: "stamps",
            label: "Stamps",
            value: `${currentStamps}/${maxPoints}`,
          },
        ],
        auxiliaryFields: [
          {
            key: "organization",
            label: "Organization",
            value: orgName,
          },
          {
            key: "offer",
            label: "Offer",
            value:
              cardConfig?.card_front_config?.offer_description ||
              `Collect ${maxPoints} stamps for a reward`,
          },
        ],
        backFields: [
          {
            key: "terms",
            label: "Terms & Conditions",
            value:
              cardConfig?.card_back_config?.description ||
              "Present this pass to earn stamps. Full card earns a free reward!",
          },
          {
            key: "website",
            label: "Website",
            value: cardConfig?.card_front_config?.website_link || currentDomain,
          },
        ],
      },
    };

    const pass = template.createPass(passConfig);

    // Add images to the pass if they were successfully downloaded and processed
    // Note: Images should be provided at @2x or @3x resolution for best quality
    if (images.icon) {
      pass.images.set("icon.png", images.icon);
      pass.images.set("icon@2x.png", images.icon);
    }

    if (images.logo) {
      pass.images.set("logo.png", images.logo);
      pass.images.set("logo@2x.png", images.logo);
    }

    if (images.strip) {
      pass.images.set("strip.png", images.strip);
      pass.images.set("strip@2x.png", images.strip);
    }

    // Generate the .pkpass buffer
    const pkpassBuffer = await pass.asBuffer();

    logger.debug("Pass buffer generated", {
      ...logContext,
      serialNumber,
      bufferSize: pkpassBuffer.length,
      bufferSizeMB: (pkpassBuffer.length / 1024 / 1024).toFixed(2),
    });

    // Store or update pass registration in database
    if (!existingPass) {
      const { error: insertError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .insert({
          user_id: user.id,
          card_id: cardId,
          serial_number: serialNumber,
          authentication_token: authenticationToken,
        });

      if (insertError) {
        logger.error("Database insert failed", {
          ...logContext,
          serialNumber,
          error: insertError.message,
          code: insertError.code,
        });
        // Continue anyway - pass generation succeeded
      } else {
        logger.debug("New pass stored in database", {
          ...logContext,
          serialNumber,
        });
      }
    } else {
      // Update last_updated_at for existing pass
      const { error: updateError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .update({ last_updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("card_id", cardId);

      if (updateError) {
        logger.warn("Failed to update pass timestamp", {
          ...logContext,
          serialNumber,
          error: updateError.message,
        });
      } else {
        logger.debug("Pass regenerated with existing credentials", {
          ...logContext,
          serialNumber,
        });
      }
    }

    logger.info("Pass generation completed successfully", {
      ...logContext,
      serialNumber,
      bufferSize: pkpassBuffer.length,
    });

    // Convert Buffer to array for serialization (Next.js can't serialize Buffer)
    return { success: true, data: Array.from(pkpassBuffer) };
  } catch (error) {
    logger.error("Pass generation exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate wallet pass",
    };
  }
}
