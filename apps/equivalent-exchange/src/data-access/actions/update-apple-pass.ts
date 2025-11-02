import "server-only";

import type { AsyncResult } from "@eq-ex/shared";
import { notifyPassUpdate } from "@eq-ex/shared/apple-wallet";

/**
 * Update Apple Wallet passes for a card by sending push notifications
 * Similar to updateGoogleWalletPass, this triggers pass updates on devices
 */
export async function updateAppleWalletPass(
  cardId: string
): Promise<AsyncResult<void>> {
  try {
    // Send push notifications to all registered devices for this card
    // notifyPassUpdate handles querying registrations and sending notifications
    const result = await notifyPassUpdate(cardId);

    // Log the results
    if (result.sent > 0) {
      console.log(
        `Sent ${result.sent} Apple Wallet push notifications for card ${cardId}`
      );
    }
    if (result.failed > 0) {
      console.warn(
        `Failed to send ${result.failed} Apple Wallet push notifications for card ${cardId}`
      );
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating Apple Wallet passes:", error);
    return { success: false, error: "Failed to update wallet passes" };
  }
}
