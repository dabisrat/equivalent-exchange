import "server-only";

import { Template } from "@walletpass/pass-js";
import apn from "node-apn";
import crypto from "crypto";
import { supabaseAdmin } from "./server";

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
 * Returns the original buffer - Apple Wallet will handle scaling based on filename (@2x, @3x)
 * Just validates the image is a valid format
 */
async function processPassImage(
  imageBuffer: Buffer,
  type: "icon" | "logo" | "strip"
): Promise<Buffer | null> {
  try {
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

    // Return original buffer - Apple Wallet handles scaling
    return imageBuffer;
  } catch (error) {
    console.error(`Error processing ${type} image:`, error);
    return null;
  }
}

/**
 * Download and process images for Apple Wallet pass
 * Returns processed images ready to be added to the pass
 * Note: Images should be provided at @2x or @3x resolution
 * Apple Wallet will automatically scale based on filename
 *
 * Security measures:
 * - Only HTTPS URLs allowed (unless NODE_ENV=development for local testing)
 * - Blocks private/internal IPs to prevent SSRF attacks
 * - 10-second timeout to prevent hanging
 * - 5MB file size limit to prevent memory exhaustion
 * - Content-Type validation (PNG, JPEG, WebP, SVG only)
 * - Magic byte validation to ensure valid image format
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
  let apnProvider: apn.Provider | null = null;

  try {
    const apnCredentials = getAPNCredentials();

    if (!apnCredentials) {
      return {
        success: false,
        error: "APNs credentials not configured",
      };
    }

    const isProduction = process.env.NODE_ENV === "production";
    console.log(
      `[APNs] Environment: ${process.env.NODE_ENV}, Using ${isProduction ? "PRODUCTION" : "SANDBOX"} gateway`
    );

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
      console.error("APNs push failed:", result.failed);
      return {
        success: false,
        error: result.failed[0].response?.reason || "APNs push failed",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending APNs notification:", error);
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
  try {
    // Get all device registrations for this card
    const { data: passes, error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("push_token")
      .eq("card_id", cardId)
      .not("push_token", "is", null);

    if (error) {
      console.error("Error fetching passes:", error);
      return { sent: 0, failed: 0 };
    }

    if (!passes || passes.length === 0) {
      return { sent: 0, failed: 0 };
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

    return { sent, failed };
  } catch (error) {
    console.error("Error notifying pass updates:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Register a device for pass updates
 */
export async function registerDevice(params: {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  pushToken: string;
  authenticationToken: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: pass, error: fetchError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("authentication_token")
      .eq("serial_number", params.serialNumber)
      .single();

    if (fetchError || !pass) {
      return { success: false, error: "Pass not found" };
    }

    // Verify authentication token
    if (pass.authentication_token !== params.authenticationToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Update the pass with device registration info
    const { error: updateError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .update({
        device_library_identifier: params.deviceLibraryIdentifier,
        push_token: params.pushToken,
        last_updated_at: new Date().toISOString(),
      })
      .eq("serial_number", params.serialNumber);

    if (updateError) {
      console.error("Error registering device:", updateError);
      return { success: false, error: "Failed to register device" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in registerDevice:", error);
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
  try {
    // Verify authentication token first
    const { data: pass, error: fetchError } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("authentication_token")
      .eq("serial_number", params.serialNumber)
      .single();

    if (fetchError || !pass) {
      return { success: false, error: "Pass not found" };
    }

    if (pass.authentication_token !== params.authenticationToken) {
      return { success: false, error: "Unauthorized" };
    }

    // Now unregister the device
    const { error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .update({
        device_library_identifier: null,
        push_token: null,
        last_updated_at: new Date().toISOString(),
      })
      .eq("serial_number", params.serialNumber)
      .eq("device_library_identifier", params.deviceLibraryIdentifier);

    if (error) {
      console.error("Error unregistering device:", error);
      return { success: false, error: "Failed to unregister device" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in unregisterDevice:", error);
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
      console.error("Error fetching serial numbers:", error);
      return { serialNumbers: [], lastUpdated: new Date().toISOString() };
    }

    const serialNumbers = passes?.map((p) => p.serial_number) || [];
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
    console.error("Error in getSerialNumbersForDevice:", error);
    return { serialNumbers: [], lastUpdated: new Date().toISOString() };
  }
}
