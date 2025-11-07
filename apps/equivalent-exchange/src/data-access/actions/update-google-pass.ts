"server-only";
import { getUser } from "@eq-ex/auth";

import type { AsyncResult } from "@eq-ex/shared";
import { supabaseAdmin } from "@eq-ex/shared/server";
import { google, walletobjects_v1 } from "googleapis";
import { logger } from "@eq-ex/shared";

// use only on the server side for now.
export async function updateGoogleWalletPass(
  cardId: string,
  organizationId: string
): Promise<AsyncResult<void>> {
  const logContext = {
    operation: "updateGoogleWalletPass",
    cardId,
    organizationId,
  };

  logger.debug("Starting updateGoogleWalletPass", logContext);
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    const userId = user.id;
    logger.debug("User authenticated", { ...logContext, userId });

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

    let passObject;
    const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`;
    const wallet = google.walletobjects({ version: "v1", auth });

    logger.debug("Fetching Google Wallet pass object", {
      ...logContext,
      userId,
      objectId,
    });
    try {
      passObject = await wallet.loyaltyobject.get({
        resourceId: objectId,
      });
    } catch (e) {
      logger.error("Error fetching Google Wallet pass object", {
        ...logContext,
        userId,
        objectId,
        error: e,
      });
      return { success: false, error: "Pass object not found" };
    }

    logger.debug("Fetched Google Wallet pass object successfully", {
      ...logContext,
      userId,
      objectId,
    });

    if (!passObject.data || passObject.data.state !== "active") {
      return { success: false, error: "Pass object not found" };
    }

    logger.debug("Querying database for card data", { ...logContext, userId });
    const { data: cardData, error: queryError } = await supabaseAdmin
      .from("reward_card")
      .select(
        `
    organization!inner(max_points),
    stamp(stamp_index, stamped)
  `
      )
      .eq("id", cardId)
      .eq("organization.id", organizationId)
      .single();

    if (queryError || !cardData) {
      return { success: false, error: "Card or organization not found" };
    }

    const org = cardData.organization;
    const stamps = cardData.stamp;

    logger.debug("Queried card data successfully", {
      ...logContext,
      userId,
      stampsCount: stamps.filter((s) => s.stamped).length,
      maxPoints: org.max_points,
    });

    const updatedObject: Partial<walletobjects_v1.Schema$LoyaltyObject> = {
      ...passObject.data,
      loyaltyPoints: {
        label: "Stamps",
        balance: {
          string: `${stamps.filter((s) => s.stamped).length}/${org.max_points}`,
        },
      },
    };

    logger.debug("Updating Google Wallet pass object", {
      ...logContext,
      userId,
      objectId,
    });
    await wallet.loyaltyobject.update({
      resourceId: objectId,
      requestBody: updatedObject,
    });

    logger.debug("Updated Google Wallet pass successfully", {
      ...logContext,
      userId,
      objectId,
    });
    return { success: true, data: undefined };
  } catch (error) {
    logger.error("Error updating Google Wallet pass", { ...logContext, error });
    return { success: false, error: "Failed to update wallet pass" };
  }
}

async function setWalletState(
  cardId: string,
  state: string
): Promise<AsyncResult<void>> {
  const logContext = {
    operation: "setWalletState",
    cardId,
    state,
  };

  logger.debug("Starting setWalletState", logContext);
  let userId: string | undefined;
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    userId = user.id;
    logger.debug("User authenticated for setWalletState", {
      ...logContext,
      userId,
    });

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

    const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`;
    const wallet = google.walletobjects({ version: "v1", auth });

    const updatedObject: Partial<walletobjects_v1.Schema$LoyaltyObject> = {
      state: state,
    };

    logger.debug("Setting wallet state", { ...logContext, userId, objectId });
    await wallet.loyaltyobject.patch({
      resourceId: objectId,
      requestBody: updatedObject,
    });

    logger.debug("Set wallet state successfully", {
      ...logContext,
      userId,
      objectId,
    });
    return { success: true, data: undefined };
  } catch (error) {
    logger.error("Error setting wallet state", {
      ...logContext,
      userId,
      error,
    });
    return { success: false, error: "Failed to update wallet pass" };
  }
}
