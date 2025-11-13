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
  serialNumber?: string; // Optional: if provided, regenerate existing pass; if not, create new pass
}

/**
 * Get current domain from request headers
 * Returns HTTPS URL for production, HTTP for localhost
 */
async function getCurrentDomain(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost:3000";

  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocalhost) {
    return `http://${host}`;
  }

  return `https://${host}`;
}

/**
 * Pass credentials for generation or regeneration
 */
interface PassCredentials {
  userId: string;
  serialNumber: string;
  authenticationToken: string;
  isRegeneration: boolean;
}

/**
 * Check if user already has a pass for this card
 * Returns existing pass credentials if found
 */
async function checkExistingPass(
  userId: string,
  cardId: string
): Promise<{ serialNumber: string; authenticationToken: string } | null> {
  const logContext = { userId, cardId };

  try {
    const { data, error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("serial_number, authentication_token")
      .eq("user_id", userId)
      .eq("card_id", cardId)
      .limit(1)
      .single();

    if (error || !data) {
      logger.debug("No existing pass found", {
        ...logContext,
        error: error?.message,
      });
      return null;
    }

    logger.info("Existing pass found, returning existing credentials", {
      ...logContext,
      serialNumber: data.serial_number,
    });

    return {
      serialNumber: data.serial_number,
      authenticationToken: data.authentication_token,
    };
  } catch (error) {
    logger.error("Error checking for existing pass", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Resolve or generate pass credentials
 * If serial number provided: Fetch from DB (API route regeneration)
 * Otherwise: Use session user (client generation)
 */
async function resolvePassCredentials(
  cardId: string,
  providedSerialNumber?: string
): Promise<AsyncResult<PassCredentials>> {
  const logContext = { cardId, serialNumber: providedSerialNumber };

  try {
    // Regenerating existing pass (called from API route with serialNumber)
    if (providedSerialNumber) {
      const { data, error } = await supabaseAdmin
        .from("apple_wallet_passes")
        .select("serial_number, authentication_token, card_id, user_id")
        .eq("serial_number", providedSerialNumber)
        .single();

      if (error || !data) {
        logger.error("Pass not found for serial number", {
          ...logContext,
          error: error?.message,
        });
        return { success: false, error: "Pass not found" };
      }

      // Verify the pass belongs to the correct card
      if (data.card_id !== cardId) {
        logger.error("Serial number does not match card", {
          ...logContext,
          foundCardId: data.card_id,
        });
        return { success: false, error: "Invalid pass" };
      }

      logger.debug("Regenerating existing pass from DB", {
        ...logContext,
        userId: data.user_id,
      });

      return {
        success: true,
        data: {
          userId: data.user_id,
          serialNumber: data.serial_number,
          authenticationToken: data.authentication_token,
          isRegeneration: true,
        },
      };
    }

    // Generating new pass (called from client without serialNumber)
    // Get userId from session
    const user = await getUser();
    const userId = user.id;

    logger.debug("Resolving pass for session user", { ...logContext, userId });

    // Check if user already has a pass for this card
    const existingPass = await checkExistingPass(userId, cardId);
    if (existingPass) {
      logger.info("Returning existing pass credentials", {
        ...logContext,
        userId,
        serialNumber: existingPass.serialNumber,
      });
      return {
        success: true,
        data: {
          userId,
          serialNumber: existingPass.serialNumber,
          authenticationToken: existingPass.authenticationToken,
          isRegeneration: true, // Treat as regeneration to skip INSERT
        },
      };
    }

    // Generating new pass for this user
    logger.debug("Generating new pass credentials for session user", {
      ...logContext,
      userId,
    });

    return {
      success: true,
      data: {
        userId,
        serialNumber: generateSerialNumber(),
        authenticationToken: generateAuthToken(),
        isRegeneration: false,
      },
    };
  } catch (error) {
    logger.error("Failed to resolve pass credentials", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Failed to resolve pass credentials",
    };
  }
}

/**
 * Card configuration data for pass generation
 */
interface CardConfiguration {
  organizationId: string;
  organizationName: string;
  maxPoints: number;
  currentStamps: number;
  cardConfig: OrganizationCardConfig;
}

/**
 * Fetch and validate card configuration from database
 */
async function fetchCardConfiguration(
  cardId: string
): Promise<AsyncResult<CardConfiguration>> {
  const logContext = { cardId };

  try {
    const { data: cardData, error: queryError } = await supabaseAdmin
      .from("reward_card")
      .select(
        `
        organization_id,
        organization!inner(organization_name, card_config, max_points),
        stamp(stamped)
      `
      )
      .eq("id", cardId)
      .single();

    if (queryError || !cardData) {
      logger.error("Card data fetch failed", {
        ...logContext,
        error: queryError?.message,
      });
      return { success: false, error: "Card or organization not found" };
    }

    const org = cardData.organization;
    const stamps = cardData.stamp || [];
    const currentStamps = stamps.filter(
      (s: { stamped: boolean | null }) => s.stamped === true
    ).length;

    logger.debug("Card configuration fetched", {
      ...logContext,
      organizationName: org?.organization_name,
      currentStamps,
      maxPoints: org.max_points,
    });

    return {
      success: true,
      data: {
        organizationId: cardData.organization_id,
        organizationName: org.organization_name || "Loyalty Program",
        maxPoints: org.max_points,
        currentStamps,
        cardConfig: org.card_config as unknown as OrganizationCardConfig,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch card configuration", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Failed to fetch card configuration",
    };
  }
}

/**
 * Pass configuration for Apple Wallet
 */
interface PassConfiguration {
  serialNumber: string;
  description: string;
  organizationName: string;
  logoText: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  webServiceURL?: string;
  authenticationToken?: string;
  barcodes: Array<{
    message: string;
    format: "PKBarcodeFormatQR";
    messageEncoding: string;
  }>;
  storeCard: {
    headerFields: Array<{ key: string; label: string; value: string }>;
    primaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
}

/**
 * Build pass configuration object for Apple Wallet
 */
async function buildPassConfiguration(
  credentials: PassCredentials,
  cardConfig: CardConfiguration,
  cardId: string
): Promise<PassConfiguration> {
  const { organizationId, organizationName, maxPoints, currentStamps } =
    cardConfig;
  const appleConfig = cardConfig.cardConfig?.apple_wallet_pass_config;

  // Get current domain for QR code and web service URL
  const currentDomain = await getCurrentDomain();
  const isLocalhost = currentDomain.startsWith("http://");

  logger.debug("Building pass configuration", {
    cardId,
    serialNumber: credentials.serialNumber,
    currentDomain,
    isLocalhost,
  });

  return {
    serialNumber: credentials.serialNumber,
    description: appleConfig?.description || `${organizationName} Loyalty Card`,
    organizationName,
    logoText: appleConfig?.logoText || organizationName,
    backgroundColor: appleConfig?.backgroundColor || "#3b82f6",
    foregroundColor: appleConfig?.foregroundColor || "#ffffff",
    labelColor: appleConfig?.labelColor || "#e5e7eb",
    // Only include webServiceURL if we're on HTTPS (Apple requirement)
    ...(isLocalhost
      ? {}
      : {
          webServiceURL: `${currentDomain}/api/apple-wallet`,
          authenticationToken: credentials.authenticationToken,
        }),
    barcodes: [
      {
        message: `${currentDomain}/${organizationId}/${cardId}`,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
    ],
    storeCard: {
      headerFields: [
        {
          key: "stamps",
          label: "Stamps",
          value: `${currentStamps}/${maxPoints}`,
        },
      ],
      primaryFields: [],
      auxiliaryFields: [
        {
          key: "organization",
          label: "Organization",
          value: organizationName,
        },
        {
          key: "offer",
          label: "Offer",
          value:
            cardConfig.cardConfig?.card_front_config?.offer_description ||
            `Collect ${maxPoints} stamps for a reward`,
        },
      ],
      backFields: [
        {
          key: "terms",
          label: "Terms & Conditions",
          value:
            cardConfig.cardConfig?.card_back_config?.description ||
            "Present this pass to earn stamps. Full card earns a free reward!",
        },
        {
          key: "website",
          label: "Website",
          value:
            cardConfig.cardConfig?.card_front_config?.website_link ||
            currentDomain,
        },
      ],
    },
  };
}

/**
 * Generate the .pkpass buffer from configuration
 */
async function generatePassBuffer(
  passConfig: PassConfiguration,
  cardConfig: CardConfiguration
): Promise<AsyncResult<Buffer>> {
  const logContext = { serialNumber: passConfig.serialNumber };

  try {
    // Get cached template
    const template = await getPassTemplate();

    // Create pass instance
    const pass = template.createPass(passConfig);

    // Download and process images from configured URLs
    const appleConfig = cardConfig.cardConfig?.apple_wallet_pass_config;
    const images = await downloadAndProcessPassImages(
      {
        iconImage: appleConfig?.iconImage,
        logoImage: appleConfig?.logoImage,
        stripImage: appleConfig?.stripImage,
      },
      cardConfig.organizationId
    );

    // Add images to the pass if available
    if (images.icon) {
      pass.images.set("icon.png", images.icon);
    }
    if (images.logo) {
      pass.images.set("logo.png", images.logo);
    }
    if (images.strip) {
      pass.images.set("strip.png", images.strip);
    }

    // Generate the .pkpass buffer
    const pkpassBuffer = await pass.asBuffer();

    logger.debug("Pass buffer generated", {
      ...logContext,
      bufferSize: pkpassBuffer.length,
      bufferSizeMB: (pkpassBuffer.length / 1024 / 1024).toFixed(2),
    });

    return { success: true, data: pkpassBuffer };
  } catch (error) {
    logger.error("Failed to generate pass buffer", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: "Failed to generate pass buffer",
    };
  }
}

/**
 * Persist pass record to database
 * For new passes: Creates initial record with NULL device fields
 * For existing passes: Updates timestamp for all device registrations
 *
 * Note: Initial row with NULL device_library_identifier is needed to store
 * serial_number and authentication_token before any device registers.
 * The UNIQUE constraint on (card_id, device_library_identifier) allows
 * multiple NULL values, so this won't conflict with device registrations.
 */
async function persistPassRecord(
  userId: string,
  cardId: string,
  credentials: PassCredentials
): Promise<AsyncResult<void>> {
  const logContext = {
    userId,
    cardId,
    serialNumber: credentials.serialNumber,
    isRegeneration: credentials.isRegeneration,
  };

  try {
    if (!credentials.isRegeneration) {
      // Insert new pass record with NULL device fields
      // This stores the serial number and auth token for later device registration
      const { error: insertError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .insert({
          user_id: userId,
          card_id: cardId,
          serial_number: credentials.serialNumber,
          authentication_token: credentials.authenticationToken,
          device_library_identifier: null,
          push_token: null,
        });

      if (insertError) {
        logger.error("Database insert failed", {
          ...logContext,
          error: insertError.message,
          code: insertError.code,
        });
        // Continue anyway - pass generation succeeded
        return {
          success: false,
          error: "Failed to save pass record",
        };
      }

      logger.debug("New pass record created", logContext);
    } else {
      // Update timestamp for all existing device registrations
      const { error: updateError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .update({ last_updated_at: new Date().toISOString() })
        .eq("serial_number", credentials.serialNumber);

      if (updateError) {
        logger.warn("Failed to update pass timestamp", {
          ...logContext,
          error: updateError.message,
        });
        return {
          success: false,
          error: "Failed to update pass record",
        };
      }

      logger.debug("Pass timestamps updated", logContext);
    }

    return { success: true, data: undefined };
  } catch (error) {
    logger.error("Failed to persist pass record", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Failed to persist pass record",
    };
  }
}

/**
 * Generate or regenerate an Apple Wallet pass for a loyalty card
 * Main orchestrator function that coordinates all steps of pass generation
 */
export async function generateAppleWalletPass({
  cardId,
  serialNumber: providedSerialNumber,
}: ApplePassData): Promise<AsyncResult<number[]>> {
  const logContext = {
    operation: "generateAppleWalletPass",
    cardId,
    serialNumber: providedSerialNumber,
  };

  logger.info("Pass generation started", logContext);

  try {
    // Step 1: Resolve or generate pass credentials
    // If serialNumber provided: Fetches userId from DB (API route)
    // Otherwise: Uses session userId (client call)
    const credentialsResult = await resolvePassCredentials(
      cardId,
      providedSerialNumber
    );
    if (!credentialsResult.success) {
      return credentialsResult;
    }
    const credentials = credentialsResult.data;
    const userId = credentials.userId;

    logger.debug("User and credentials resolved", {
      ...logContext,
      userId,
      serialNumber: credentials.serialNumber,
    });

    // Step 2: Fetch card configuration
    const cardConfigResult = await fetchCardConfiguration(cardId);
    if (!cardConfigResult.success) {
      return cardConfigResult;
    }
    const cardConfig = cardConfigResult.data;

    // Step 3: Build pass configuration
    const passConfig = await buildPassConfiguration(
      credentials,
      cardConfig,
      cardId
    );

    // Step 4: Generate pass buffer
    const bufferResult = await generatePassBuffer(passConfig, cardConfig);
    if (!bufferResult.success) {
      return bufferResult;
    }
    const pkpassBuffer = bufferResult.data;

    // Step 5: Persist pass record to database
    // For new passes: Creates initial row with NULL device fields
    // For existing passes: Updates timestamps for all device registrations
    await persistPassRecord(userId, cardId, credentials);

    logger.info("Pass generation completed successfully", {
      ...logContext,
      serialNumber: credentials.serialNumber,
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
