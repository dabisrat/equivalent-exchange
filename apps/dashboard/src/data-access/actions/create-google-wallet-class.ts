"use server";

//TODO: use only the libraries needed for this file
import { google, walletobjects_v1 } from "googleapis";
import type { AsyncResult } from "@eq-ex/shared";
import { verifyUserAutherization } from "../queries/authHelpers";

interface CreateLoyaltyClassData {
  organizationId: string;
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  heroImageUrl?: string;
}

enum MultipleDevicesAndHoldersAllowedStatus {
  MULTIPLE_HOLDERS = "MULTIPLE_HOLDERS",
  ONE_USER_ALL_DEVICES = "ONE_USER_ALL_DEVICES",
  ONE_USER_ONE_DEVICES = "ONE_USER_ONE_DEVICES",
}

export async function createGoogleWalletLoyaltyClass({
  organizationId,
  organizationName,
  logoUrl,
  primaryColor,
  heroImageUrl,
}: CreateLoyaltyClassData): Promise<AsyncResult<string>> {
  try {
    //verify user authorization
    const authResult = await verifyUserAutherization(organizationId);
    if (!authResult.success) {
      return { success: false, error: authResult.message };
    }

    if (logoUrl?.includes("localhost") || logoUrl?.includes("127.0.0.1")) {
      logoUrl =
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
      programName: `${organizationName.substring(0, 15)} Rewards`,
      hexBackgroundColor: primaryColor || "#3b82f6",
      reviewStatus: "UNDER_REVIEW",
      multipleDevicesAndHoldersAllowedStatus:
        MultipleDevicesAndHoldersAllowedStatus.ONE_USER_ALL_DEVICES,
    };

    if (logoUrl) {
      loyaltyClass.programLogo = {
        sourceUri: {
          uri: logoUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
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
    const walletClass = await wallet.loyaltyclass.get({
      resourceId: loyaltyClass.id!,
    });

    if (walletClass) {
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
