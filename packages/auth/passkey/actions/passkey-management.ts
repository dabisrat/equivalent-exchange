"use server";

import { createClient } from "@eq-ex/shared/server";
import type { AsyncResult } from "@eq-ex/shared";

interface PasskeyCredential {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

/**
 * List all passkeys for the current user
 */
export async function listUserPasskeys(): Promise<AsyncResult<PasskeyCredential[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: credentials, error } = await supabase
      .from("user_credentials")
      .select("id, credential_id, device_name, created_at, last_used_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching passkeys:", error);
      return { success: false, error: "Failed to fetch passkeys" };
    }

    return { success: true, data: credentials || [] };
  } catch (error) {
    console.error("Error listing passkeys:", error);
    return { success: false, error: "Failed to list passkeys" };
  }
}

/**
 * Delete a specific passkey
 */
export async function deletePasskey(credentialId: string): Promise<AsyncResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify the credential belongs to the user before deleting
    const { error } = await supabase
      .from("user_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting passkey:", error);
      return { success: false, error: "Failed to delete passkey" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting passkey:", error);
    return { success: false, error: "Failed to delete passkey" };
  }
}

/**
 * Update the name of a passkey
 */
export async function updatePasskeyName(
  credentialId: string,
  newName: string
): Promise<AsyncResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("user_credentials")
      .update({ device_name: newName })
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating passkey name:", error);
      return { success: false, error: "Failed to update passkey name" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating passkey name:", error);
    return { success: false, error: "Failed to update passkey name" };
  }
}
