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
}

export async function createGoogleWalletLoyaltyClass({
  organizationId,
  organizationName,
  logoUrl,
  primaryColor,
}: CreateLoyaltyClassData): Promise<AsyncResult<string>> {
  try {
    //verify user authorization
    const authResult = await verifyUserAutherization(organizationId);
    if (!authResult.success) {
      return { success: false, error: authResult.message };
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
    };

    if (
      logoUrl &&
      !logoUrl.includes("127.0.0.1") &&
      !logoUrl.includes("localhost")
    ) {
      loyaltyClass.programLogo = {
        sourceUri: {
          uri: logoUrl,
        },
      };
    } else {
      // Use a simple placeholder logo for development or when no logo is available
      loyaltyClass.programLogo = {
        sourceUri: {
          uri: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        },
      };
    }

    // Create the loyalty class
    const response = await wallet.loyaltyclass.insert({
      requestBody: loyaltyClass,
    });

    if (response.status === 200 && response.data?.id) {
      return { success: true, data: response.data.id };
    } else {
      return { success: false, error: "Failed to create loyalty class" };
    }
  } catch (error) {
    console.error("Error creating Google Wallet loyalty class:", error);
    return { success: false, error: "Failed to create wallet loyalty class" };
  }
}
