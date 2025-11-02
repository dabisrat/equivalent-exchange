"use server";

import { supabaseAdmin } from "@eq-ex/shared/server";
import type { AsyncResult } from "@eq-ex/shared";
import { appleWalletPassConfigSchema } from "@eq-ex/shared/schemas/card-config";
import { revalidatePath } from "next/cache";
import { verifyUserAuthorization } from "../queries/authHelpers";

interface UpdateAppleWalletPassConfigParams {
  organizationId: string;
  appleWalletPassConfig: unknown; // Will be validated by Zod
}

export async function updateAppleWalletPassConfig({
  organizationId,
  appleWalletPassConfig,
}: UpdateAppleWalletPassConfigParams): Promise<AsyncResult<void>> {
  try {
    // Verify user has permission to update this organization
    const authResult = await verifyUserAuthorization(organizationId);
    if (!authResult.success) {
      return { success: false, error: authResult.message };
    }

    // Validate and sanitize the input
    const validationResult = appleWalletPassConfigSchema.safeParse(
      appleWalletPassConfig
    );
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid configuration: ${validationResult.error.message}`,
      };
    }

    const validatedConfig = validationResult.data;

    // Get current card_config
    const { data: org, error: fetchError } = await supabaseAdmin
      .from("organization")
      .select("card_config")
      .eq("id", organizationId)
      .single();

    if (fetchError) {
      return { success: false, error: "Organization not found" };
    }

    // Merge with existing config
    const currentConfig = (org.card_config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      apple_wallet_pass_config: validatedConfig,
    };

    // Update organization with new config
    const { error: updateError } = await supabaseAdmin
      .from("organization")
      .update({ card_config: updatedConfig })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Error updating Apple Wallet config:", updateError);
      return { success: false, error: "Failed to update configuration" };
    }

    // TODO: Implement pass update notifications
    // When config changes, existing passes in users' wallets are NOT automatically updated.
    // To enable updates, need to implement:
    // 1. Pass registration tracking (store device tokens when users add passes)
    // 2. Apple Push Notification service integration for passes
    // 3. Web service endpoints for Apple Wallet to fetch updated passes
    // 4. Send push notifications to all registered devices when config changes
    // See: https://developer.apple.com/documentation/walletpasses/updating_a_pass

    revalidatePath("/card-design");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error in updateAppleWalletPassConfig:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update configuration",
    };
  }
}
