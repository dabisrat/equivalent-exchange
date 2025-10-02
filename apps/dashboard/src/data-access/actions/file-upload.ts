"use server";
import { getUser } from "@eq-ex/auth";
import { createClient as createServerClient } from "@eq-ex/shared/server";
import { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path to delete
 */
export async function deleteFile(bucket: string, path: string) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const supabase = await createServerClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("File delete error:", error);
    throw error;
  }
}

/**
 * Update organization logo
 * @param organizationId - Organization ID
 * @param logoUrl - New logo URL or null to remove
 * @param logoPath - Storage path for cleanup
 */
export async function updateOrganizationLogo(
  organizationId: string,
  logoUrl: string | null,
  logoPath?: string
) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const supabase = await createServerClient();

    // Verify user has permission to update this organization
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
      throw new Error("Insufficient permissions to update organization");
    }

    // Delete old logo if exists
    if (logoPath) {
      await deleteFile("organization-assets", logoPath);
    }

    // Update organization
    const { error } = await supabase
      .from("organization")
      .update({ logo_url: logoUrl })
      .eq("id", organizationId);

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Update organization logo error:", error);
    throw error;
  }
}

/**
 * Update card configuration with background images
 * @param organizationId - Organization ID
 * @param config - Card configuration updates
 */
export async function updateCardConfig(
  organizationId: string,
  config: {
    card_front_config?: OrganizationCardConfig["card_front_config"];
    card_back_config?: OrganizationCardConfig["card_back_config"];
  }
) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const supabase = await createServerClient();

    // Verify user has permission to update this organization
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || !["owner", "admin"].includes(orgMember.role)) {
      throw new Error("Insufficient permissions to update organization");
    }

    // Get current config
    const { data: org } = await supabase
      .from("organization")
      .select("card_config")
      .eq("id", organizationId)
      .single();

    if (!org) {
      throw new Error("Organization not found");
    }

    // Parse and merge configs safely
    const currentConfig: OrganizationCardConfig =
      (org.card_config as any) || {};
    const updatedConfig = {
      ...currentConfig,
      card_front_config: {
        ...currentConfig.card_front_config,
        ...config.card_front_config,
      },
      card_back_config: {
        ...currentConfig.card_back_config,
        ...config.card_back_config,
      },
    };

    // Update organization
    const { error } = await supabase
      .from("organization")
      .update({ card_config: updatedConfig as any })
      .eq("id", organizationId);

    if (error) {
      throw new Error(`Failed to update card config: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Update card config error:", error);
    throw error;
  }
}

/**
 * Update card front background image
 * @param organizationId - Organization ID
 * @param backgroundImageUrl - New background image URL or null to remove
 */
export async function updateCardFrontBackground(
  organizationId: string,
  backgroundImageUrl: string | null
) {
  return updateCardConfig(organizationId, {
    card_front_config: { background_image: backgroundImageUrl || undefined },
  });
}

/**
 * Update card back background image
 * @param organizationId - Organization ID
 * @param backgroundImageUrl - New background image URL or null to remove
 */
export async function updateCardBackBackground(
  organizationId: string,
  backgroundImageUrl: string | null
) {
  return updateCardConfig(organizationId, {
    card_back_config: { background_image: backgroundImageUrl || undefined },
  });
}

/**
 * Update card front dark background image
 * @param organizationId - Organization ID
 * @param backgroundImageUrl - New dark background image URL or null to remove
 */
export async function updateCardFrontDarkBackground(
  organizationId: string,
  backgroundImageUrl: string | null
) {
  return updateCardConfig(organizationId, {
    card_front_config: {
      dark_background_image: backgroundImageUrl || undefined,
    },
  });
}

/**
 * Update card back dark background image
 * @param organizationId - Organization ID
 * @param backgroundImageUrl - New dark background image URL or null to remove
 */
export async function updateCardBackDarkBackground(
  organizationId: string,
  backgroundImageUrl: string | null
) {
  return updateCardConfig(organizationId, {
    card_back_config: {
      dark_background_image: backgroundImageUrl || undefined,
    },
  });
}
