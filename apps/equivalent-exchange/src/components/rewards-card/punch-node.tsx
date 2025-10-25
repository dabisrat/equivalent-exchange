"use client";

import { updateStampById } from "@app/data-access/actions/rewards-card";
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
import { FaRegLemon, FaLemon } from "react-icons/fa6";
import { PunchNodeConfig } from "@eq-ex/shared/utils/shared.types";

// Interfaces and Types
interface PunchNodeProps {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  index: number;
  loading: boolean;
  config?: PunchNodeConfig;
}

interface FillAnimationProps {
  config: PunchNodeConfig;
  size: number;
  animationDuration: string | undefined;
}

type NodeState = "loading" | "punched" | "unpunched";
type IconKey = keyof typeof ICONS;
type SizeKey = "small" | "medium" | "large";
type AnimationType = "spin" | "pulse" | "bounce" | "ping" | "flip" | "fill";

// Constants
const ICONS = {
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
  FaRegLemon,
  FaLemon,
} as const;

const SIZES: Record<SizeKey, number> = {
  small: 16,
  medium: 24,
  large: 32,
};

const ANIMATIONS: Record<AnimationType, string> = {
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  ping: "animate-ping",
  flip: "animate-flip",
  fill: "animate-fill",
};

const COLOR_CLASSES: Record<NodeState, string> = {
  punched: "text-primary",
  unpunched: "text-primary",
  loading: "text-accent",
};

const DEFAULT_CONFIG: PunchNodeConfig = {
  id: "default-free",
  name: "Free Tier Default",
  type: "standard",
  size: { punched: "large", unpunched: "medium", loading: "large" },
  icons: {
    punched: "RiExchangeFill",
    unpunched: "MdCircle",
    loading: "RiExchangeFill",
  },
  animation: { enabled: true, loading: { type: "flip" } },
};

// Utility Functions
function getIconName(state: NodeState, config: PunchNodeConfig): string {
  return (
    (state === "loading" && config.icons.loading) ||
    (state === "punched" && config.icons.punched) ||
    config.icons.unpunched
  );
}

function getSize(state: NodeState, config: PunchNodeConfig): number {
  const sizeKey = ((state === "loading" && config.size.loading) ||
    (state === "punched" && config.size.punched) ||
    config.size.unpunched) as SizeKey;

  return SIZES[sizeKey];
}

function getAnimationClass(state: NodeState, config: PunchNodeConfig): string {
  if (!config.animation?.enabled) return "";

  const animationConfig =
    config.animation[state as keyof typeof config.animation];
  if (!animationConfig || typeof animationConfig !== "object") return "";

  const animationType = animationConfig.type as AnimationType;
  return ANIMATIONS[animationType] || "";
}

function getAnimationDuration(
  state: NodeState,
  config: PunchNodeConfig
): string | undefined {
  if (!config.animation?.enabled) return undefined;

  const animationConfig =
    config.animation[state as keyof typeof config.animation];
  if (!animationConfig || typeof animationConfig !== "object") return undefined;

  return animationConfig.duration ? `${animationConfig.duration}ms` : undefined;
}

function getContainerClasses(state: NodeState, animationClass: string): string {
  const baseClasses =
    "flex justify-center items-center cursor-pointer relative w-8 h-8";
  const colorClass =
    animationClass === "animate-fill" ? "text-accent" : COLOR_CLASSES[state];
  const animation = animationClass === "animate-fill" ? "" : animationClass;

  return `${baseClasses} ${colorClass} ${animation}`.trim();
}

function getContainerStyles(
  animationClass: string,
  animationDuration: string | undefined
): React.CSSProperties | undefined {
  if (animationDuration && animationClass !== "animate-fill") {
    return { "--duration": animationDuration } as React.CSSProperties;
  }
  return undefined;
}

function FillAnimation({
  config,
  size,
  animationDuration,
}: FillAnimationProps) {
  const UnfilledIconComponent =
    ICONS[config.icons.unpunched as IconKey] || MdCircle;
  const FilledIconComponent =
    ICONS[config.icons.punched as IconKey] || MdCircle;

  return (
    <>
      <UnfilledIconComponent
        color="currentColor"
        fontSize={size}
        className="relative text-accent"
      />
      <div
        className="absolute inset-0 overflow-hidden flex justify-center items-center animate-fill text-primary"
        style={
          animationDuration
            ? ({ "--duration": animationDuration } as React.CSSProperties)
            : undefined
        }
      >
        <FilledIconComponent
          color="currentColor"
          fontSize={size}
          className="relative z-20"
        />
      </div>
    </>
  );
}

// Main Component
export default function PunchNode({
  cardId,
  punched,
  canModify,
  index,
  loading,
  config = DEFAULT_CONFIG,
}: PunchNodeProps) {
  const [isPunching, setIsPunching] = useState(false);

  const isLoading = loading || isPunching;
  const handleClick = async (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || !canModify) return;

    setIsPunching(true);
    try {
      await updateStampById(cardId, index);
    } finally {
      setIsPunching(false);
    }
  };

  const state: NodeState = isLoading
    ? "loading"
    : punched
      ? "punched"
      : "unpunched";
  const iconName = getIconName(state, config);
  const size = getSize(state, config);
  const animationClass = getAnimationClass(state, config);
  const animationDuration = getAnimationDuration(state, config);
  const IconComponent = ICONS[iconName as IconKey] || MdCircle;

  return (
    <div
      className={getContainerClasses(state, animationClass)}
      style={getContainerStyles(animationClass, animationDuration)}
      onClick={handleClick}
    >
      {animationClass === "animate-fill" ? (
        <FillAnimation
          config={config}
          size={size}
          animationDuration={animationDuration}
        />
      ) : (
        <IconComponent color="currentColor" fontSize={size} />
      )}
    </div>
  );
}
