"use server";

import { createClient } from "@eq-ex/shared/server";
import { getUser } from "@eq-ex/auth";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import type { AsyncResult } from "@eq-ex/shared";

interface GooglePassData {
  cardId: string;
  organizationId: string;
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
  organizationId,
}: GooglePassData): Promise<AsyncResult<string>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get card data
    const supabase = await createClient();
    const { data: card, error: cardError } = await supabase
      .from("reward_card")
      .select("id, points, created_at")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();

    if (cardError || !card) {
      return { success: false, error: "Card not found or access denied" };
    }

    // Get organization data
    const { data: org, error: orgError } = await supabase
      .from("organization")
      .select("organization_name, card_config, primary_color, logo_url")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    // Get stamps
    const { data: stamps, error: stampsError } = await supabase
      .from("stamp")
      .select("stamp_index, stamped")
      .eq("reward_card_id", cardId)
      .order("stamp_index");

    if (stampsError) {
      return { success: false, error: "Failed to load stamps" };
    }

    // Create JWT payload for Google Wallet
    const currentDomain = await getCurrentDomain();
    const payload = {
      iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
      origins: [currentDomain],
      payload: {
        loyaltyObjects: [
          {
            id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`,
            classId: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_class_${organizationId}`,
            state: "ACTIVE",
            accountId: user.id,
            accountName: user.email?.split("@")[0] || "User",
            loyaltyPoints: {
              balance: {
                int: card.points,
              },
              label: "Points",
            },
            secondaryLoyaltyPoints: {
              balance: {
                int: stamps.filter((s) => s.stamped).length,
              },
              label: "Stamps",
            },
            barcode: {
              type: "QR_CODE",
              value: `${currentDomain}/${organizationId}/${cardId}`,
            },
            textModulesData: [
              {
                header: "Points",
                body: `${card.points}`,
                id: "points",
              },
              {
                header: "Stamps",
                body: `${stamps.filter((s) => s.stamped).length}/${stamps.length}`,
                id: "stamps",
              },
              {
                header: "Organization",
                body: org.organization_name,
                id: "organization",
              },
            ],
          },
        ],
        loyaltyClasses: [
          {
            id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_class_${organizationId}`,
            issuerName: org.organization_name,
            programName: `${org.organization_name} Rewards`,
            programLogo: org.logo_url
              ? {
                  sourceUri: {
                    uri: org.logo_url,
                  },
                }
              : undefined,
            hexBackgroundColor: org.primary_color || "#3b82f6",
            textModulesData: [
              {
                header: "Points",
                body: `${card.points}`,
                id: "points",
              },
              {
                header: "Stamps",
                body: `${stamps.filter((s) => s.stamped).length}/${stamps.length}`,
                id: "stamps",
              },
              {
                header: "Organization",
                body: org.organization_name,
                id: "organization",
              },
            ],
          },
        ],
      },
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
