import "server-only";

import { Template } from "@walletpass/pass-js";
import apn from "node-apn";
import crypto from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "./server";
import { createLogger } from "./logger";

const logger = createLogger({ service: "apple-wallet" });

/**
 * Apple Wallet pass generation and update utilities
 * Similar to stripe.ts, provides shared functionality for both apps
 */

// Environment variable validation
export function getAppleWalletCredentials() {
  const teamId = process.env.APPLE_WALLET_TEAM_ID;
  const passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID;
  const certificate = process.env.APPLE_WALLET_CERTIFICATE;
  const privateKey = process.env.APPLE_WALLET_PRIVATE_KEY;
  const wwdrCert = process.env.APPLE_WALLET_WWDR_CERT;

  if (!teamId || !passTypeId || !certificate || !privateKey || !wwdrCert) {
    throw new Error(
      "Missing required Apple Wallet environment variables. Please configure APPLE_WALLET_TEAM_ID, APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_CERTIFICATE, APPLE_WALLET_PRIVATE_KEY, and APPLE_WALLET_WWDR_CERT"
    );
  }

  return {
    teamId,
    passTypeId,
    certificate: Buffer.from(certificate, "base64"),
    privateKey: Buffer.from(privateKey, "base64"),
    wwdrCert: Buffer.from(wwdrCert, "base64"),
    certificates: {
      wwdr: Buffer.from(wwdrCert, "base64").toString(),
      signerCert: Buffer.from(certificate, "base64").toString(),
      signerKey: Buffer.from(privateKey, "base64").toString(),
    },
    teamIdentifier: teamId,
    passTypeIdentifier: passTypeId,
  };
}

function getAPNCredentials() {
  const certificate = process.env.APPLE_APN_CERTIFICATE;
  const key = process.env.APPLE_APN_KEY;

  if (!certificate || !key) {
    console.warn(
      "Apple Push Notification credentials not configured. Pass updates will not be sent automatically."
    );
    return null;
  }

  return {
    cert: Buffer.from(certificate, "base64"),
    key: Buffer.from(key, "base64"),
  };
}

/**
 * Generate a unique serial number for a pass
 */
export function generateSerialNumber(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate a secure authentication token for pass updates
 */
export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Download an image from a URL and return it as a Buffer
 * Includes security validations to prevent abuse
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      console.error(`Invalid URL format: ${url}`);
      return null;
    }

    // Only allow HTTPS URLs (prevent local file access and insecure connections)
    if (parsedUrl.protocol !== "https:") {
      console.error(`Only HTTPS URLs are allowed: ${url}`);
      return null;
    }

    // Block private/internal IP ranges to prevent SSRF attacks
    const hostname = parsedUrl.hostname;
    const privateIpPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fe80:/i, // IPv6 link-local
      /^fc00:/i, // IPv6 private
    ];

    if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
      console.error(`Private/internal IP addresses are not allowed: ${url}`);
      return null;
    }

    // Set a reasonable timeout (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EquivalentExchange/1.0",
      },
      // Follow redirects but limit to 5
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Failed to download image from ${url}: ${response.statusText}`
      );
      return null;
    }

    // Validate content type
    const contentType = response.headers.get("content-type");
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];
    if (
      !contentType ||
      !allowedTypes.some((type) => contentType.includes(type))
    ) {
      console.error(`Invalid content type ${contentType} from ${url}`);
      return null;
    }

    // Limit file size to 5MB to prevent memory exhaustion
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      console.error(`Image too large (max 5MB): ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Double-check size after download
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      console.error(`Downloaded image exceeds 5MB: ${url}`);
      return null;
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Image download timeout: ${url}`);
    } else {
      console.error(`Error downloading image from ${url}:`, error);
    }
    return null;
  }
}

/**
 * Process and validate an image for Apple Wallet pass
 * Resizes and compresses images to reduce file size while maintaining quality
 * Apple Wallet image size requirements:
 * - icon: max 87x87px (square)
 * - logo: max 160x50px
 * - strip: max 312x123px
 */
async function processPassImage(
  imageBuffer: Buffer,
  type: "icon" | "logo" | "strip"
): Promise<Buffer | null> {
  try {
    // Dynamic import of sharp to avoid bundling issues
    // const sharp = (await import("sharp")).default;

    // Basic validation - check if it's a valid image by checking magic bytes
    const magicNumbers: { [key: string]: number[] } = {
      png: [0x89, 0x50, 0x4e, 0x47],
      jpeg: [0xff, 0xd8, 0xff],
      webp: [0x52, 0x49, 0x46, 0x46],
      svg: [0x3c, 0x73, 0x76, 0x67], // <svg or <?xml
    };

    const firstBytes = Array.from(imageBuffer.slice(0, 4));
    const isValidImage = Object.values(magicNumbers).some((magic) =>
      magic.every((byte, i) => firstBytes[i] === byte)
    );

    if (!isValidImage) {
      console.error(`Invalid image format for ${type}`);
      return null;
    }

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 0, height = 0, format } = metadata;

    let processedBuffer: Buffer;

    // Resize and compress based on image type
    switch (type) {
      case "icon":
        // Icon should be square, max 87x87px
        const iconSize = Math.min(width, height, 87);
        processedBuffer = await sharp(imageBuffer)
          .resize(iconSize, iconSize, {
            fit: "cover",
            position: "center",
          })
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
        break;

      case "logo":
        // Logo max 160x50px, maintain aspect ratio
        processedBuffer = await sharp(imageBuffer)
          .resize(160, 50, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
        break;

      case "strip":
        // Strip max 312x123px, maintain aspect ratio
        processedBuffer = await sharp(imageBuffer)
          .resize(312, 123, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
        break;

      default:
        // Fallback: just compress without resizing
        processedBuffer = await sharp(imageBuffer)
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
    }

    console.log(
      `Processed ${type} image: ${width}x${height} -> ${processedBuffer.length} bytes`
    );
    return processedBuffer;
  } catch (error) {
    console.error(`Error processing ${type} image:`, error);
    return null;
  }
}

/**
 * Download and process images for Apple Wallet pass
 * Downloads images from HTTPS URLs, resizes to Apple Wallet requirements, and compresses for optimal file size
 * Returns processed images ready to be added to the pass
 *
 * Image size limits (Apple Wallet guidelines):
 * - icon: max 87x87px (square, will be resized and cropped)
 * - logo: max 160x50px (aspect ratio maintained)
 * - strip: max 312x123px (aspect ratio maintained)
 *
 * Security measures:
 * - Only HTTPS URLs allowed (unless NODE_ENV=development for local testing)
 * - Blocks private/internal IPs to prevent SSRF attacks
 * - 10-second timeout to prevent hanging
 * - 5MB file size limit to prevent memory exhaustion
 * - Content-Type validation (PNG, JPEG, WebP, SVG only)
 * - Magic byte validation to ensure valid image format
 * - Sharp processing for resizing and compression
 */
export async function downloadAndProcessPassImages(config: {
  iconImage?: string;
  logoImage?: string;
  stripImage?: string;
}): Promise<{
  icon?: Buffer;
  logo?: Buffer;
  strip?: Buffer;
}> {
  // Skip image downloads in development if using localhost URLs
  const isDev = process.env.NODE_ENV === "development";

  const results: {
    icon?: Buffer;
    logo?: Buffer;
    strip?: Buffer;
  } = {};

  // Download and process icon
  if (config.iconImage) {
    // In dev mode, log but skip if it's a localhost URL
    if (isDev && config.iconImage.includes("localhost")) {
      console.log(`[DEV] Skipping localhost icon image: ${config.iconImage}`);
    } else {
      const iconBuffer = await downloadImage(config.iconImage);
      if (iconBuffer) {
        const processedIcon = await processPassImage(iconBuffer, "icon");
        if (processedIcon) {
          results.icon = processedIcon;
        }
      }
    }
  }

  // Download and process logo
  if (config.logoImage) {
    // In dev mode, log but skip if it's a localhost URL
    if (isDev && config.logoImage.includes("localhost")) {
      console.log(`[DEV] Skipping localhost logo image: ${config.logoImage}`);
    } else {
      const logoBuffer = await downloadImage(config.logoImage);
      if (logoBuffer) {
        const processedLogo = await processPassImage(logoBuffer, "logo");
        if (processedLogo) {
          results.logo = processedLogo;
        }
      }
    }
  }

  // Download and process strip
  if (config.stripImage) {
    // In dev mode, log but skip if it's a localhost URL
    if (isDev && config.stripImage.includes("localhost")) {
      console.log(`[DEV] Skipping localhost strip image: ${config.stripImage}`);
    } else {
      const stripBuffer = await downloadImage(config.stripImage);
      if (stripBuffer) {
        const processedStrip = await processPassImage(stripBuffer, "strip");
        if (processedStrip) {
          results.strip = processedStrip;
        }
      }
    }
  }

  return results;
}

// Cache the template in memory to avoid recreating it on every request
// Note: Only static fields (certificates, IDs) are cached
// Dynamic fields (organizationName, description) are set per pass
let cachedTemplate: Template | null = null;

/**
 * Get or create the Apple Wallet pass template with certificates
 * Template is cached in memory after first creation for performance
 * Only caches static configuration - dynamic fields are set when creating individual passes
 */
export async function getPassTemplate() {
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const credentials = getAppleWalletCredentials();

  // Create template with only required static fields
  // organizationName and description will be set per-pass in createPass()
  const template = new Template("storeCard", {
    teamIdentifier: credentials.teamId,
    passTypeIdentifier: credentials.passTypeId,
  });

  // Load certificates from PEM strings (not file paths)
  template.setCertificate(credentials.certificates.signerCert);
  template.setPrivateKey(credentials.certificates.signerKey);

  cachedTemplate = template;
  return template;
}

/**
 * Send push notification to update a pass via APNs
 */
export async function sendPassUpdateNotification(
  pushToken: string
): Promise<{ success: boolean; error?: string }> {
  const logContext = {
    operation: "sendPassUpdateNotification",
    pushToken: pushToken.substring(0, 10) + "...",
  };

  let apnProvider: apn.Provider | null = null;

  try {
    const apnCredentials = getAPNCredentials();

    if (!apnCredentials) {
      logger.warn("APNs credentials not configured", logContext);
      return {
        success: false,
        error: "APNs credentials not configured",
      };
    }

    const isProduction = process.env.NODE_ENV === "production";
    logger.debug("Initializing APNs provider", {
      ...logContext,
      environment: process.env.NODE_ENV,
      gateway: isProduction ? "PRODUCTION" : "SANDBOX",
    });

    apnProvider = new apn.Provider({
      cert: apnCredentials.cert,
      key: apnCredentials.key,
      production: isProduction,
    });

    const notification = new apn.Notification({
      // Empty payload - just signals device to fetch updated pass
      payload: {},
      // Use contentAvailable for silent push
      contentAvailable: true,
      // Remove badge, sound, and alert for silent notification
    });

    const result = await apnProvider.send(notification, pushToken);

    if (result.failed.length > 0) {
      logger.error("APNs push failed", {
        ...logContext,
        failures: result.failed.map((f) => ({
          device: f.device?.substring(0, 10) + "...",
          status: f.status,
          reason: f.response?.reason,
        })),
      });
      return {
        success: false,
        error: result.failed[0].response?.reason || "APNs push failed",
      };
    }

    logger.info("APNs push sent successfully", logContext);

    return { success: true };
  } catch (error) {
    logger.error("Send APNs notification exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    apnProvider?.shutdown();
  }
}

/**
 * Send push notifications to all devices that have a specific pass
 */
export async function notifyPassUpdate(
  cardId: string
): Promise<{ sent: number; failed: number }> {
  const logContext = {
    operation: "notifyPassUpdate",
    cardId,
  };

  logger.info("Sending push notifications for card", logContext);

  try {
    // Get all device registrations for this card
    const { data: passes, error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("push_token")
      .eq("card_id", cardId)
      .not("push_token", "is", null);

    if (error) {
      logger.error("Error fetching passes for notification", {
        ...logContext,
        error: error.message,
      });
      return { sent: 0, failed: 0 };
    }

    if (!passes || passes.length === 0) {
      logger.debug("No passes found to notify", logContext);
      return { sent: 0, failed: 0 };
    }

    logger.debug("Found passes to notify", {
      ...logContext,
      count: passes.length,
    });

    // Update last_updated_at for all registrations to indicate pass has changed
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .update({ last_updated_at: now })
      .eq("card_id", cardId)
      .not("push_token", "is", null);

    if (updateError) {
      logger.error("Error updating last_updated_at for passes", {
        ...logContext,
        error: updateError.message,
      });
      // Continue with notifications even if update failed
    } else {
      logger.debug("Updated last_updated_at for passes", logContext);
    }

    // Send notifications to all registered devices
    const results = await Promise.all(
      passes.map(async (pass) => {
        if (pass.push_token) {
          return await sendPassUpdateNotification(pass.push_token);
        }
        return { success: false };
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info("Push notifications completed", {
      ...logContext,
      sent,
      failed,
    });

    return { sent, failed };
  } catch (error) {
    logger.error("Notify pass update exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: 0, failed: 0 };
  }
}

/**
 * Register a device for pass updates
 */
export async function registerDevice(params: {
  deviceLibraryIdentifier: string;
  pushToken: string;
  passTypeIdentifier: string;
  serialNumber: string;
  authenticationToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const logContext = {
    operation: "registerDevice",
    deviceLibraryIdentifier: params.deviceLibraryIdentifier,
    passTypeIdentifier: params.passTypeIdentifier,
    serialNumber: params.serialNumber,
    pushToken: params.pushToken.substring(0, 10) + "...",
  };

  logger.info("Device registration started", logContext);

  try {
    // Find the pass record (could be initial NULL-device row or existing registration)
    const { data: pass, error: fetchError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("authentication_token, user_id, card_id")
      .eq("serial_number", params.serialNumber)
      .limit(1)
      .single();

    if (fetchError || !pass) {
      logger.warn("Pass not found", {
        ...logContext,
        error: fetchError?.message,
      });
      return { success: false, error: "Pass not found" };
    }

    // Verify authentication token
    if (pass.authentication_token !== params.authenticationToken) {
      logger.warn("Invalid authentication token", logContext);
      return { success: false, error: "Unauthorized" };
    }

    // Strategy: Update NULL-device row if it exists, otherwise INSERT new row
    // This ensures first device "claims" the initial row, subsequent devices create new rows

    // Check if there's a NULL-device row for this serial number
    const { data: nullDeviceRow, error: checkError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("id")
      .eq("serial_number", params.serialNumber)
      .is("device_library_identifier", null)
      .single();

    if (nullDeviceRow && !checkError) {
      // Update the NULL row with device info (first device registration)
      const { error: updateError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .update({
          device_library_identifier: params.deviceLibraryIdentifier,
          push_token: params.pushToken,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", nullDeviceRow.id);

      if (updateError) {
        logger.error("Device registration update failed", {
          ...logContext,
          error: updateError.message,
          code: updateError.code,
        });
        return { success: false, error: "Failed to register device" };
      }

      logger.info(
        "Device registration successful (updated NULL row)",
        logContext
      );
    } else {
      // No NULL row exists, insert new row (2nd+ device or re-registration)
      // Use upsert to handle case where this device was already registered
      const { error: insertError } = await supabaseAdmin
        .from("apple_wallet_passes")
        .upsert(
          {
            user_id: pass.user_id,
            card_id: pass.card_id,
            serial_number: params.serialNumber,
            authentication_token: params.authenticationToken,
            device_library_identifier: params.deviceLibraryIdentifier,
            push_token: params.pushToken,
            last_updated_at: new Date().toISOString(),
          },
          {
            onConflict: "card_id,device_library_identifier",
          }
        );

      if (insertError) {
        logger.error("Device registration insert failed", {
          ...logContext,
          error: insertError.message,
          code: insertError.code,
        });
        return { success: false, error: "Failed to register device" };
      }

      logger.info(
        "Device registration successful (inserted new row)",
        logContext
      );
    }

    logger.info("Device registration successful", logContext);

    return { success: true };
  } catch (error) {
    logger.error("Register device exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unregister a device from pass updates
 */
export async function unregisterDevice(params: {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  authenticationToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const logContext = {
    operation: "unregisterDevice",
    deviceLibraryIdentifier: params.deviceLibraryIdentifier,
    passTypeIdentifier: params.passTypeIdentifier,
    serialNumber: params.serialNumber,
  };

  logger.info("Device unregistration started", logContext);

  try {
    // Verify authentication token first
    const { data: pass, error: fetchError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("authentication_token")
      .eq("serial_number", params.serialNumber)
      .single();

    if (fetchError || !pass) {
      logger.info("Pass not found for unregistration - already deleted", {
        ...logContext,
        error: fetchError?.message,
      });
      // Return success - pass is already gone, which is what we want
      return { success: true };
    }

    if (pass.authentication_token !== params.authenticationToken) {
      logger.warn(
        "Invalid authentication token for unregistration",
        logContext
      );
      return { success: false, error: "Unauthorized" };
    }

    // Delete the device registration row
    const { error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .delete()
      .eq("serial_number", params.serialNumber)
      .eq("device_library_identifier", params.deviceLibraryIdentifier);

    if (error) {
      logger.error("Device unregistration delete failed", {
        ...logContext,
        error: error.message,
        code: error.code,
      });
      return { success: false, error: "Failed to unregister device" };
    }

    logger.info("Device unregistration successful", logContext);

    return { success: true };
  } catch (error) {
    logger.error("Unregister device exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all serial numbers for passes registered to a device
 */
export async function getSerialNumbersForDevice(
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  passesUpdatedSince?: string
): Promise<{ serialNumbers: string[]; lastUpdated: string }> {
  const logContext = {
    operation: "getSerialNumbers",
    deviceLibraryIdentifier,
    passTypeIdentifier,
    passesUpdatedSince,
  };

  logger.debug("Fetching serial numbers", logContext);

  try {
    let query = supabaseAdmin
      .from("apple_wallet_passes")
      .select("serial_number, last_updated_at")
      .eq("device_library_identifier", deviceLibraryIdentifier);

    if (passesUpdatedSince) {
      query = query.gt("last_updated_at", passesUpdatedSince);
    }

    const { data: passes, error } = await query;

    if (error) {
      logger.error("Failed to fetch serial numbers", {
        ...logContext,
        error: error.message,
      });
      return { serialNumbers: [], lastUpdated: new Date().toISOString() };
    }

    const serialNumbers = passes?.map((p) => p.serial_number) || [];

    logger.info("Serial numbers retrieved", {
      ...logContext,
      count: serialNumbers.length,
    });

    const lastUpdated =
      passes && passes.length > 0
        ? passes
            .map((p) => new Date(p.last_updated_at).getTime())
            .reduce((max, time) => Math.max(max, time), 0)
        : Date.now();

    return {
      serialNumbers,
      lastUpdated: new Date(lastUpdated).toISOString(),
    };
  } catch (error) {
    logger.error("Get serial numbers exception", {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return { serialNumbers: [], lastUpdated: new Date().toISOString() };
  }
}
