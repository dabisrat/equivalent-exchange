"server-only";
import { getUser } from "@eq-ex/auth";

import type { AsyncResult } from "@eq-ex/shared";
import { supabaseAdmin } from "@eq-ex/shared/server";
import { google, walletobjects_v1 } from "googleapis";

// use only on the server side for now.
export async function updateGoogleWalletPass(
  cardId: string,
  organizationId: string
): Promise<AsyncResult<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

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

    try {
      passObject = await wallet.loyaltyobject.get({
        resourceId: objectId,
      });
    } catch (e) {
      console.error("Error fetching Google Wallet pass object:", e);
      return { success: false, error: "Pass object not found" };
    }

    if (!passObject.data || passObject.data.state !== "active") {
      return { success: false, error: "Pass object not found" };
    }

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

    const updatedObject: Partial<walletobjects_v1.Schema$LoyaltyObject> = {
      ...passObject.data,
      loyaltyPoints: {
        label: "Stamps",
        balance: {
          string: `${stamps.filter((s) => s.stamped).length}/${org.max_points}`,
        },
      },
    };

    await wallet.loyaltyobject.update({
      resourceId: objectId,
      requestBody: updatedObject,
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating Google Wallet pass:", error);
    return { success: false, error: "Failed to update wallet pass" };
  }
}

async function setWalletState(
  cardId: string,
  state: string
): Promise<AsyncResult<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

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

    await wallet.loyaltyobject.patch({
      resourceId: objectId,
      requestBody: updatedObject,
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating Google Wallet pass:", error);
    return { success: false, error: "Failed to update wallet pass" };
  }
}
