/**
 * Rewards Card Configuration Interfaces
 *
 * These interfaces define the structure for organization-level card configuration
 * stored in the database as JSONB columns.
 */

import { z } from "zod";

/**
 * Front card configuration - controls the branding and offer display on the front of the card
 */
export interface CardFrontConfig {
  /** Organization logo image URL or file path */
  logo?: string;
  /** Organization/company name (displayed prominently) */
  company_name?: string;
  /** Description of the reward offer (e.g., "Buy 9 Get 1 Free") */
  offer_description?: string;
  /** Optional link to organization's website */
  website_link?: string;
  /** Optional background image URL or file path */
  background_image?: string;
  /** Optional dark mode background image URL or file path */
  dark_background_image?: string;
}

/**
 * Back card configuration - controls additional information displayed on the back
 */
export interface CardBackConfig {
  /** Optional link to another relevant website (different from front) */
  website_link?: string;
  /** Optional additional card description or terms */
  description?: string;
  /** Optional background image URL or file path */
  background_image?: string;
  /** Optional dark mode background image URL or file path */
  dark_background_image?: string;
}

/**
 * Punch node (stamp) configuration - controls individual stamp appearance and behavior
 */
export interface PunchNodeConfig {
  /** Unique identifier for the punch node */
  id: string;
  /** Display name for the punch node */
  name: string;
  /** Type of punch node */
  type: "standard" | "special" | "bonus";
  /** Size configuration for different states */
  size: {
    /** Size when punched/stamped */
    punched: "small" | "medium" | "large";
    /** Size when not punched */
    unpunched: "small" | "medium" | "large";
    /** Optional size when loading */
    loading?: "small" | "medium" | "large";
  };
  /** Color configuration for different states */
  colors?: {
    /** CSS color when stamped */
    punched: string;
    /** CSS color when not stamped */
    unpunched: string;
    /** Optional CSS color when loading */
    loading?: string;
  };
  /** Icon configuration for different states */
  icons: {
    /** Icon name when stamped */
    punched: string;
    /** Icon name when not stamped */
    unpunched: string;
    /** Optional icon name when loading */
    loading?: string;
  };
  /** Optional animation configuration */
  animation?: {
    /** Whether animations are enabled */
    enabled: boolean;
    /** Optional loading animation configuration */
    loading?: {
      /** Animation type */
      type: "spin" | "pulse" | "bounce" | "flip" | "ping" | "fill";
      /** Optional animation duration in milliseconds */
      duration?: number;
    };
    /** Optional punched state animation configuration */
    punched?: Record<string, any>;
    /** Optional unpunched state animation configuration */
    unpunched?: Record<string, any>;
  };
}

/**
 * Layout configuration - controls how the back of the card is visually arranged
 */
export interface CardLayoutConfig {
  /** Layout arrangement style */
  variant:
    | "vertical"
    | "grid-first"
    | "two-column"
    | "two-column-reverse"
    | "overlay"
    | "custom";
  /** Optional layout customization settings */
  options?: {
    /** Vertical spacing (0-100px) for stacked variants */
    gap?: number;
    /** Content column width % (0-100) for two-column variants */
    topWidth?: number;
    /** Stamp column width % (0-100) for two-column variants */
    gridWidth?: number;
    /** Control stamp distribution in row */
    gridJustify?: "around" | "between" | "center" | "start" | "end" | "evenly";
    /** Overlay-specific options */
    overlay?: {
      /** Show background behind content */
      backdrop?: boolean;
      /** Apply blur effect */
      blur?: boolean;
      /** Reduce stamp opacity */
      dimGrid?: boolean;
    };
    /** Legacy custom layout pattern (deprecated in favor of customGrid) */
    pattern?: {
      rows: number;
      cols: number;
      cells: Array<{
        row: number;
        col: number;
        type: "punch" | "content" | "empty";
        punchIndex?: number;
        span?: { row?: number; col?: number };
      }>;
    };
    /** Tailwind-based custom grid layout configuration */
    customGrid?: {
      /** Tailwind classes for the grid container */
      containerClasses?: string;
      /** Tailwind classes for positioning the content */
      contentClasses?: string;
      /** Define each punch node's position */
      punchNodes: Array<{
        /** Which punch node (0-based) */
        index: number;
        /** Tailwind classes for positioning this punch node */
        classes: string;
      }>;
    };
  };
}

/**
 * Complete organization card configuration
 * This combines all card-related settings stored at the organization level
 */
export interface OrganizationCardConfig {
  /** Front card branding and offer details */
  card_front_config: CardFrontConfig;
  /** Back card description and links */
  card_back_config: CardBackConfig;
  /** Layout arrangement and styling options */
  card_layout_config: CardLayoutConfig;
  /** Individual stamp appearance and behavior */
  punch_node_config: PunchNodeConfig;
  /** Custom theme CSS string for full theme customization */
  custom_theme_css?: string;
  /** Google Wallet loyalty class configuration */
  google_wallet_class_config?: {
    /** Program name for the loyalty class */
    programName?: string;
    /** Background color in hex format */
    hexBackgroundColor?: string;
    /** Program logo URL */
    programLogoUrl?: string;
    /** Hero image URL */
    heroImageUrl?: string;
  };
  /** Apple Wallet pass configuration */
  apple_wallet_pass_config?: AppleWalletPassConfig;
}

/**
 * Apple Wallet pass configuration - controls the appearance of Apple Wallet passes
 * Based on Apple's StoreCard pass type for loyalty programs
 */
export interface AppleWalletPassConfig {
  /** Background color in hex format (e.g., #3b82f6) */
  backgroundColor?: string;
  /** Foreground color for text in hex format (e.g., #ffffff) */
  foregroundColor?: string;
  /** Label color for field labels in hex format */
  labelColor?: string;
  /** Text displayed next to logo on pass */
  logoText?: string;
  /** Strip image URL displayed behind primary fields */
  stripImage?: string;
  /** Icon image URL (must be square, recommended 29x29 @3x) */
  iconImage?: string;
  /** Logo image URL displayed in top left */
  logoImage?: string;
  /** Organization description shown on pass */
  description?: string;
}

/**
 * Zod schema for Apple Wallet pass configuration validation
 * Enforces HTTPS URLs and reasonable length limits to prevent abuse
 */
export const appleWalletPassConfigSchema = z.object({
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .optional(),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .optional(),
  labelColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .optional(),
  logoText: z
    .string()
    .max(50, "Logo text must be 50 characters or less")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  stripImage: z
    .string()
    .refine(
      (val: string) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          return url.protocol === "https:";
        } catch {
          return false;
        }
      },
      "Must be a valid HTTPS URL"
    )
    .optional()
    .or(z.literal("")),
  iconImage: z
    .string()
    .refine(
      (val: string) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          return url.protocol === "https:";
        } catch {
          return false;
        }
      },
      "Must be a valid HTTPS URL"
    )
    .optional()
    .or(z.literal("")),
  logoImage: z
    .string()
    .refine(
      (val: string) => {
        if (!val) return true;
        try {
          const url = new URL(val);
          return url.protocol === "https:";
        } catch {
          return false;
        }
      },
      "Must be a valid HTTPS URL"
    )
    .optional()
    .or(z.literal("")),
}) satisfies z.ZodType<AppleWalletPassConfig>;
