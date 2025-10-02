/**
 * Rewards Card Configuration Interfaces
 *
 * These interfaces define the structure for organization-level card configuration
 * stored in the database as JSONB columns.
 */

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
      type: "spin" | "pulse" | "bounce" | "flip" | "ping";
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
    | "vertical-condensed"
    | "vertical-separated"
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
}

/**
 * Individual card configuration overrides
 * Cards can override specific organization-level settings
 */
export interface CardConfigOverrides {
  /** Override front card configuration */
  card_front_config?: Partial<CardFrontConfig>;
  /** Override back card configuration */
  card_back_config?: Partial<CardBackConfig>;
  /** Override layout configuration */
  card_layout_config?: Partial<CardLayoutConfig>;
  /** Override punch node configuration */
  punch_node_config?: Partial<PunchNodeConfig>;
}
