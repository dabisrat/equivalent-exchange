"use server";

//TODO: use only the libraries needed for this file
import { google, walletobjects_v1 } from "googleapis";
import type { AsyncResult } from "@eq-ex/shared";
import { verifyUserAuthorization } from "../queries/authHelpers";
import { getOrganizationById } from "../queries/organizations";
import type { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";
import { supabaseAdmin } from "@eq-ex/shared/server";

interface CreateLoyaltyClassData {
  organizationId: string;
  organizationName: string;
}

interface UpdateWalletClassConfigData {
  organizationId: string;
  googleWalletClassConfig: {
    programName?: string;
    hexBackgroundColor?: string;
    programLogoUrl?: string;
    heroImageUrl?: string;
  };
}

export async function updateGoogleWalletClassConfig({
  organizationId,
  googleWalletClassConfig,
}: UpdateWalletClassConfigData): Promise<AsyncResult<void>> {
  try {
    // Verify user authorization
    const authResult = await verifyUserAuthorization(organizationId);
    if (!authResult.success) {
      return { success: false, error: authResult.message };
    }

    // Fetch current organization data
    const orgResult = await getOrganizationById(organizationId);
    if (!orgResult.success || !orgResult.data) {
      return { success: false, error: "Organization not found" };
    }

    const organization = orgResult.data;
    const cardConfig =
      organization.card_config as unknown as OrganizationCardConfig;

    // Update the google_wallet_class_config
    const updatedCardConfig = {
      ...cardConfig,
      google_wallet_class_config: {
        ...cardConfig?.google_wallet_class_config,
        ...googleWalletClassConfig,
      },
    };

    // Update the database
    const { error: updateError } = await supabaseAdmin
      .from("organization")
      .update({ card_config: updatedCardConfig as any })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Error updating card config:", updateError);
      return { success: false, error: "Failed to update wallet class config" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating Google Wallet class config:", error);
    return { success: false, error: "Failed to update wallet class config" };
  }
}

interface CreateLoyaltyClassData {
  organizationId: string;
  organizationName: string;
}

enum MultipleDevicesAndHoldersAllowedStatus {
  MULTIPLE_HOLDERS = "MULTIPLE_HOLDERS",
  ONE_USER_ALL_DEVICES = "ONE_USER_ALL_DEVICES",
  ONE_USER_ONE_DEVICES = "ONE_USER_ONE_DEVICES",
}

export async function createGoogleWalletLoyaltyClass({
  organizationId,
  organizationName,
}: CreateLoyaltyClassData): Promise<AsyncResult<string>> {
  try {
    //verify user authorization
    const authResult = await verifyUserAuthorization(organizationId);
    if (!authResult.success) {
      return { success: false, error: authResult.message };
    }

    // Fetch organization data with card_config
    const orgResult = await getOrganizationById(organizationId);
    if (!orgResult.success || !orgResult.data) {
      return { success: false, error: "Organization not found" };
    }

    const organization = orgResult.data;
    const cardConfig =
      organization.card_config as unknown as OrganizationCardConfig;
    const walletConfig = cardConfig?.google_wallet_class_config;

    // Use config values or defaults
    const programName =
      walletConfig?.programName ||
      `${organizationName.substring(0, 15)} Rewards`;
    const hexBackgroundColor =
      walletConfig?.hexBackgroundColor ||
      organization.primary_color ||
      "#3b82f6";
    let programLogoUrl = walletConfig?.programLogoUrl || organization.logo_url;
    const heroImageUrl = walletConfig?.heroImageUrl;

    if (
      programLogoUrl?.includes("localhost") ||
      programLogoUrl?.includes("127.0.0.1")
    ) {
      programLogoUrl =
        "https://as1.ftcdn.net/jpg/02/48/92/96/1000_F_248929619_JkVBYroM1rSrshWJemrcjriggudHMUhV.jpg";
    }

    // Set up authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });

    // Create Wallet API client
    const wallet = google.walletobjects({ version: "v1", auth });

    // Prepare the loyalty class data
    const loyaltyClass: walletobjects_v1.Schema$LoyaltyClass = {
      id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_class_${organizationId}`,
      issuerName: organizationName.substring(0, 20),
      programName,
      hexBackgroundColor,
      reviewStatus: "UNDER_REVIEW",
      multipleDevicesAndHoldersAllowedStatus:
        MultipleDevicesAndHoldersAllowedStatus.ONE_USER_ALL_DEVICES,
    };

    if (programLogoUrl) {
      loyaltyClass.programLogo = {
        sourceUri: {
          uri: programLogoUrl,
        },
      };
    }

    if (heroImageUrl) {
      loyaltyClass.heroImage = {
        sourceUri: {
          uri: heroImageUrl,
        },
      };
    }

    let walletClass;

    try {
      walletClass = await wallet.loyaltyclass.get({
        resourceId: loyaltyClass.id!,
      });
    } catch (error) {
      console.error("Loyalty class not found, will create a new one.", error);
    }

    if (walletClass?.data) {
      delete loyaltyClass.multipleDevicesAndHoldersAllowedStatus;
      await wallet.loyaltyclass.update({
        requestBody: loyaltyClass,
        resourceId: loyaltyClass.id!,
      });
    } else {
      await wallet.loyaltyclass.insert({
        requestBody: loyaltyClass,
      });
    }

    return { success: true, data: "" };
  } catch (error) {
    console.error("Error creating Google Wallet loyalty class:", error);
    return { success: false, error: "Failed to create wallet loyalty class" };
  }
}
