import { OrganizationCardConfig } from "../schemas/card-config";

/**
 * Default values for card configuration
 */
const DEFAULT_CARD_FRONT_CONFIG = {
  company_name: "",
  offer_description: "",
  website_link: "",
  show_content: true,
};

const DEFAULT_CARD_BACK_CONFIG = {
  website_link: "",
  description: "",
};

const DEFAULT_CARD_LAYOUT_CONFIG = {
  variant: "vertical" as const,
};

const DEFAULT_PUNCH_NODE_CONFIG = {
  size: {
    punched: "large" as const,
    unpunched: "medium" as const,
  },
  icons: {
    punched: "RiExchangeFill",
    unpunched: "MdCircle",
  },
  animation: {
    enabled: true,
    loading: {
      type: "flip" as const,
    },
  },
};

/**
 * Normalizes a card configuration by ensuring all required sub-objects exist
 * with sensible defaults. This handles backwards compatibility when new fields
 * are added to the schema.
 *
 * @param config - The existing card configuration (may be partial or undefined)
 * @returns A complete OrganizationCardConfig with all fields populated
 */
export function normalizeCardConfig(
  config: Partial<OrganizationCardConfig> | null | undefined
): OrganizationCardConfig {
  return {
    card_front_config: {
      ...DEFAULT_CARD_FRONT_CONFIG,
      ...config?.card_front_config,
    },
    card_back_config: {
      ...DEFAULT_CARD_BACK_CONFIG,
      ...config?.card_back_config,
    },
    card_layout_config: {
      ...DEFAULT_CARD_LAYOUT_CONFIG,
      ...config?.card_layout_config,
    },
    punch_node_config: {
      ...DEFAULT_PUNCH_NODE_CONFIG,
      ...config?.punch_node_config,
      size: {
        ...DEFAULT_PUNCH_NODE_CONFIG.size,
        ...config?.punch_node_config?.size,
      },
      icons: {
        ...DEFAULT_PUNCH_NODE_CONFIG.icons,
        ...config?.punch_node_config?.icons,
      },
      animation:
        config?.punch_node_config?.animation ??
        DEFAULT_PUNCH_NODE_CONFIG.animation,
    },
  };
}
