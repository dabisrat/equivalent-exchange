"use server";

import { supabaseAdmin } from "@eq-ex/shared/server";
import { getUser } from "@eq-ex/auth";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import type { AsyncResult } from "@eq-ex/shared";
import { google } from "googleapis";
import type { walletobjects_v1 } from "googleapis";
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

    // Parse card config to get offer description
    const cardConfig = org.card_config as {
      card_front_config?: { offer_description?: string };
    } | null;
    const offerDescription = cardConfig?.card_front_config?.offer_description;

    const currentDomain = await getCurrentDomain();
    // Prepare Google Wallet client so we can ensure the server-side object is up to date before linking
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
    const wallet = google.walletobjects({ version: "v1", auth });
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
          secondaryLoyaltyPoints: {
            label: "Offer",
            balance: {
              string: offerDescription || "",
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
            {
              header: "Email",
              body: user.email || "Not Available",
              id: "email",
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

    // Before returning the save URL, ensure the object is present/updated on Google's servers.
    // If the object already exists, merge and update it. Swallow any update errors so we don't block the save.
    const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`;
    const existingObject = await wallet.loyaltyobject
      .get({ resourceId: objectId })
      .catch((err) => {
        // If the lookup fails for any reason, just log and treat it as not found; do not throw.
        console.error("Failed to fetch existing wallet object (non-blocking)", {
          objectId,
          error: err,
        });
        return undefined;
      });

    if (existingObject?.data) {
      const newObj = walletObject.loyaltyObjects[0];
      const mergedObject: walletobjects_v1.Schema$LoyaltyObject = {
        ...existingObject.data,
        ...newObj,
      } as any;

      // Do not let update failures block the user from saving the pass. Log and continue.
      await wallet.loyaltyobject
        .update({ resourceId: objectId, requestBody: mergedObject })
        .catch((err) => {
          console.error(
            "Failed to update existing wallet object before generateJWT:",
            err
          );
        });
    }

    const token = await createGoogleWalletJWT(payload);

    // Generate save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return { success: true, data: saveUrl };
  } catch (error) {
    console.error("Error generating Google Wallet pass:", error);
    return { success: false, error: "Failed to generate wallet pass" };
  }
}
