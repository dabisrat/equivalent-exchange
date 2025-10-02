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
import { PunchNodeConfig } from "@eq-ex/shared/utils/shared.types";

interface PunchNodeProps {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  index: number;
  config?: PunchNodeConfig;
}

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
} as const;

const SIZES = {
  small: 16,
  medium: 24,
  large: 32,
} as const;

const ANIMATIONS = {
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  ping: "animate-ping",
  flip: "animate-flip",
} as const;

const COLOR_CLASSES = {
  punched: "text-primary",
  unpunched: "text-primary",
  loading: "text-accent",
} as const;

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

export default function PunchNode({
  cardId,
  punched,
  canModify,
  index,
  config = DEFAULT_CONFIG,
}: PunchNodeProps) {
  const [isLoading, setLoading] = useState(false);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !canModify) return;

    setLoading(true);
    updateStampById(cardId, index).finally(() => setLoading(false));
  };

  // Determine current state
  const state = isLoading ? "loading" : punched ? "punched" : "unpunched";

  // Get current values based on state
  const iconName =
    (state === "loading" && config.icons.loading) ||
    (state === "punched" && config.icons.punched) ||
    config.icons.unpunched;

  const sizeKey =
    (state === "loading" && config.size.loading) ||
    (state === "punched" && config.size.punched) ||
    config.size.unpunched;

  const size = SIZES[sizeKey];

  // Get animation
  const animationConfig =
    config.animation?.enabled &&
    config.animation[state as keyof typeof config.animation];
  const animationClass =
    animationConfig &&
    typeof animationConfig === "object" &&
    animationConfig.type in ANIMATIONS
      ? ANIMATIONS[animationConfig.type as keyof typeof ANIMATIONS]
      : "";
  const animationDuration =
    animationConfig &&
    typeof animationConfig === "object" &&
    animationConfig.duration
      ? `${animationConfig.duration}ms`
      : undefined;

  // Get icon component
  const IconComponent = ICONS[iconName as keyof typeof ICONS] || MdCircle;

  return (
    <div
      className={`flex justify-center items-center cursor-pointer ${animationClass} ${COLOR_CLASSES[state]}`}
      style={{ width: "32px", height: "32px", animationDuration }}
      onClick={handleClick}
      title={`${config.name} - ${config.type}`}
    >
      <IconComponent color="currentColor" fontSize={size} />
    </div>
  );
}
