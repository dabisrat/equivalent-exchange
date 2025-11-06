"use server";

import { supabaseAdmin } from "@eq-ex/shared/server";
import { getUser } from "@eq-ex/auth";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import type { AsyncResult } from "@eq-ex/shared";
import { type walletobjects_v1 } from "googleapis";
interface GooglePassData {
  cardId: string;
}

// Google Wallet JWT generation
async function createGoogleWalletJWT(payload: any) {
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );
  if (!privateKey) {
    throw new Error("Google Wallet private key not configured");
  }

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
  });

  return token;
}

async function getCurrentDomain(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost:3000";

  // Handle localhost development
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `http://${host}`;
  }

  // For production, assume HTTPS
  return `https://${host}`;
}

export async function generateGoogleWalletPass({
  cardId,
}: GooglePassData): Promise<AsyncResult<string>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: cardData, error: queryError } = await supabaseAdmin
      .from("reward_card")
      .select(
        `
    organization_id,
    organization!inner(organization_name, card_config, primary_color, logo_url, max_points),
    stamp(stamp_index, stamped)
  `
      )
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();

    if (queryError || !cardData) {
      return { success: false, error: "Card or organization not found" };
    }

    const org = cardData.organization;
    const organizationId = cardData.organization_id;
    const stamps = cardData.stamp;

    const currentDomain = await getCurrentDomain();
    const walletObject: {
      loyaltyObjects: Array<walletobjects_v1.Schema$LoyaltyObject>;
    } = {
      loyaltyObjects: [
        {
          classId: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_class_${organizationId}`,
          id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`,
          state: "ACTIVE",
          accountId: user.id,
          accountName:
            user.user_metadata?.full_name ??
            user.email?.split("@")?.[0] ??
            "User",
          loyaltyPoints: {
            label: "Stamps",
            balance: {
              string: `${stamps.filter((s) => s.stamped).length}/${org.max_points}`,
            },
          },
          barcode: {
            type: "QR_CODE",
            value: `${currentDomain}/${organizationId}/${cardId}`,
          },
          appLinkData: {
            webAppLinkInfo: {
              appTarget: {
                targetUri: {
                  uri: `${currentDomain}/${organizationId}/${cardId}`,
                },
              },
            },
          },
          textModulesData: [
            {
              header: "Organization",
              body: org.organization_name,
              id: "organization",
            },
          ],
        },
      ],
    };

    // Create JWT payload for Google Wallet
    const payload = {
      iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
      origins: [currentDomain],
      payload: walletObject,
    };

    const token = await createGoogleWalletJWT(payload);

    // Generate save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return { success: true, data: saveUrl };
  } catch (error) {
    console.error("Error generating Google Wallet pass:", error);
    return { success: false, error: "Failed to generate wallet pass" };
  }
}
