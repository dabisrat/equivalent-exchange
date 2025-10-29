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

    const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.loyalty_object_${cardId}`;
    const wallet = google.walletobjects({ version: "v1", auth });

    const passObject = await wallet.loyaltyobject.get({
      resourceId: objectId,
    });

    if (!passObject.data || passObject.data.state !== "active") {
      return { success: false, error: "Pass object not found" };
    }

    // Get organization data
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organization")
      .select("max_points")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    // Get stamps
    const { data: stamps, error: stampsError } = await supabaseAdmin
      .from("stamp")
      .select("stamp_index, stamped")
      .eq("reward_card_id", cardId)
      .order("stamp_index");

    if (stampsError) {
      return { success: false, error: "Failed to load stamps" };
    }
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
