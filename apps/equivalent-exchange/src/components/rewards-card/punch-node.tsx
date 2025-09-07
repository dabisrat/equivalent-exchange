"use client";
import { updateStampById } from "@app/utils/data-access";
import { MouseEvent, useState } from "react";
import {
  MdCircle,
  MdStars,
  MdStar,
  MdStarBorder,
  MdAutorenew,
  MdDiamond,
  MdOutlineDiamond,
  MdFavorite,
  MdFavoriteBorder,
} from "react-icons/md";
import { RiExchangeFill } from "react-icons/ri";

export interface PunchNodeConfig {
  id: string;
  name: string;
  type: "standard" | "special" | "bonus";
  size: {
    punched: "small" | "medium" | "large";
    unpunched: "small" | "medium" | "large";
    loading?: "small" | "medium" | "large";
  };
  colors: {
    punched: string;
    unpunched: string;
    loading?: string;
  };
  icons: {
    punched: string; // Icon name from react-icons
    unpunched: string;
    loading?: string;
  };
  animation?: {
    enabled: boolean;
    loading?: {
      type: "spin" | "pulse" | "bounce";
      duration?: number;
    };
    punched?: {
      type: "spin" | "pulse" | "bounce";
      duration?: number;
    };
    unpunched?: {
      type: "spin" | "pulse" | "bounce";
      duration?: number;
    };
  };
  points?: number; // Optional point value override
}

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  MdCircle,
  MdStars,
  MdStar,
  MdStarBorder,
  MdAutorenew,
  MdDiamond,
  MdOutlineDiamond,
  MdFavorite,
  MdFavoriteBorder,
  RiExchangeFill,
} as const;

// Size mapping
const SIZE_MAP = {
  small: { width: "24px", height: "24px", fontSize: "24px" },
  medium: { width: "32px", height: "32px", fontSize: "32px" },
  large: { width: "40px", height: "40px", fontSize: "40px" },
} as const;

// Animation class mapping
const ANIMATION_MAP = {
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
} as const;

// Default configuration for free tier
const DEFAULT_CONFIG: PunchNodeConfig = {
  id: "default-free",
  name: "Free Tier Default",
  type: "standard",
  size: {
    punched: "medium",
    unpunched: "small",
    loading: "medium",
  },
  colors: {
    punched: "#6b7280",
    unpunched: "#6b7280",
    loading: "#6b7280",
  },
  icons: {
    punched: "RiExchangeFill",
    unpunched: "MdCircle",
    loading: "RiExchangeFill",
  },
  animation: {
    enabled: true,
    loading: {
      type: "pulse",
    },
  },
};

interface PunchNodeProps {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  index: number;
  config?: PunchNodeConfig;
}

export default function PunchNode({
  cardId,
  punched,
  canModify,
  index,
  config = DEFAULT_CONFIG,
}: PunchNodeProps) {
  const [isLoading, setLoading] = useState(false);

  function punchClicked(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || !canModify) {
      return;
    }

    setLoading(true);
    updateStampById(cardId, index).finally(() => setLoading(false));
  }

  // Get the appropriate icon component
  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || MdCircle;
  };

  // Get the current state (loading, punched, unpunched)
  const getCurrentState = () => {
    if (isLoading) return "loading";
    if (punched) return "punched";
    return "unpunched";
  };

  const currentState = getCurrentState();
  const IconComponent = getIcon(
    currentState === "loading" && config.icons.loading
      ? config.icons.loading
      : currentState === "punched"
        ? config.icons.punched
        : config.icons.unpunched
  );

  const currentColor =
    currentState === "loading" && config.colors.loading
      ? config.colors.loading
      : currentState === "punched"
        ? config.colors.punched
        : config.colors.unpunched;

  // Get the appropriate size based on current state
  const getCurrentSize = () => {
    if (currentState === "loading" && config.size.loading) {
      return config.size.loading;
    }
    if (currentState === "punched") {
      return config.size.punched;
    }
    return config.size.unpunched;
  };

  const currentSizeKey = getCurrentSize();
  const size = SIZE_MAP[currentSizeKey];

  // Get animation configuration for current state
  const getAnimationForState = () => {
    if (!config.animation?.enabled) return null;

    switch (currentState) {
      case "loading":
        return config.animation.loading;
      case "punched":
        return config.animation.punched;
      case "unpunched":
        return config.animation.unpunched;
      default:
        return null;
    }
  };

  const currentAnimation = getAnimationForState();
  const animationClass = currentAnimation
    ? ANIMATION_MAP[currentAnimation.type]
    : "";

  const animationDuration = currentAnimation?.duration
    ? `${currentAnimation.duration}ms`
    : undefined;

  return (
    <div
      className={`flex justify-center items-center cursor-pointer ${animationClass}`}
      style={{
        width: size.width,
        height: size.height,
        animationDuration: animationDuration,
      }}
      onClick={punchClicked}
      title={`${config.name} - ${config.type}`}
    >
      <IconComponent color={currentColor} style={{ fontSize: size.fontSize }} />
    </div>
  );
}
